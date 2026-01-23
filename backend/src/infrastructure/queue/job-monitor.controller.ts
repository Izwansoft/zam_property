import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Job } from 'bullmq';
import { JwtAuthGuard } from '@core/auth';
import { Roles, RequirePermission } from '@core/rbac';
import { RolesGuard, PermissionsGuard } from '@core/rbac';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queue.constants';
import {
  QueueNameEnum,
  QueueStatsResponse,
  QueuesHealthResponse,
  JobInfoResponse,
  ListJobsQueryDto,
  RetryJobDto,
  RetryJobResponse,
  AddJobDto,
  AddJobResponse,
} from './dto/job-monitor.dto';

/**
 * Job monitoring controller for queue management.
 * Provides endpoints for monitoring queue health, viewing job statuses,
 * and managing failed jobs.
 *
 * Per part-31.md health check specifications.
 */
@ApiTags('Job Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/jobs')
@Roles('SUPER_ADMIN', 'TENANT_ADMIN')
export class JobMonitorController {
  private readonly logger = new Logger(JobMonitorController.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * Get health status of all queues.
   */
  @Get('health')
  @ApiOperation({ summary: 'Get queue health status' })
  @ApiResponse({ status: 200, type: QueuesHealthResponse })
  @RequirePermission('jobs:read')
  async getQueuesHealth(): Promise<QueuesHealthResponse> {
    const allStats = await this.queueService.getAllQueuesStats();

    // Also add listing.expire queue (not in QUEUE_NAMES)
    const listingExpireStats = await this.queueService.getQueueStats('listing.expire');
    if (listingExpireStats) {
      allStats.push({ ...listingExpireStats, name: 'listing.expire' });
    }

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const totalFailed = allStats.reduce((sum, q) => sum + q.failed, 0);
    const totalWaiting = allStats.reduce((sum, q) => sum + q.waiting, 0);

    if (totalFailed > 50) {
      status = 'unhealthy';
    } else if (totalFailed > 10 || totalWaiting > 1000) {
      status = 'degraded';
    }

    const queues: QueueStatsResponse[] = await Promise.all(
      allStats.map(async (stat) => {
        const queue = this.queueService.getQueue(stat.name);
        const isPaused = queue ? await queue.isPaused() : false;
        return {
          name: stat.name,
          waiting: stat.waiting,
          active: stat.active,
          completed: stat.completed,
          failed: stat.failed,
          delayed: stat.delayed,
          isPaused,
        };
      }),
    );

    return {
      queues,
      timestamp: new Date().toISOString(),
      status,
    };
  }

  /**
   * Get stats for a specific queue.
   */
  @Get('queues/:queueName')
  @ApiOperation({ summary: 'Get stats for a specific queue' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @ApiResponse({ status: 200, type: QueueStatsResponse })
  @RequirePermission('jobs:read')
  async getQueueStats(@Param('queueName') queueName: string): Promise<QueueStatsResponse> {
    const stats = await this.queueService.getQueueStats(queueName);

    if (!stats) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    const queue = this.queueService.getQueue(queueName);
    const isPaused = queue ? await queue.isPaused() : false;

    return {
      name: stats.name,
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      delayed: stats.delayed,
      isPaused,
    };
  }

  /**
   * List jobs with optional filtering.
   */
  @Get('list')
  @ApiOperation({ summary: 'List jobs with optional filtering' })
  @ApiResponse({ status: 200, type: [JobInfoResponse] })
  @RequirePermission('jobs:read')
  async listJobs(
    @Query() query: ListJobsQueryDto,
  ): Promise<{ jobs: JobInfoResponse[]; total: number }> {
    const { queue: queueName, state, page = 1, limit = 20 } = query;

    // Get target queues
    const targetQueues: string[] = queueName ? [queueName] : Object.values(QUEUE_NAMES);

    const allJobs: JobInfoResponse[] = [];

    for (const qName of targetQueues) {
      const queue = this.queueService.getQueue(qName);
      if (!queue) continue;

      // Get jobs based on state
      const states = state ? [state] : ['waiting', 'active', 'completed', 'failed', 'delayed'];

      for (const jobState of states) {
        let jobs: Job[] = [];
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        switch (jobState) {
          case 'waiting':
            jobs = await queue.getWaiting(start, end);
            break;
          case 'active':
            jobs = await queue.getActive(start, end);
            break;
          case 'completed':
            jobs = await queue.getCompleted(start, end);
            break;
          case 'failed':
            jobs = await queue.getFailed(start, end);
            break;
          case 'delayed':
            jobs = await queue.getDelayed(start, end);
            break;
        }

        for (const job of jobs) {
          allJobs.push(this.mapJobToResponse(job, qName, jobState));
        }
      }
    }

    // Sort by createdAt desc
    allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedJobs = allJobs.slice(start, start + limit);

    return {
      jobs: paginatedJobs,
      total: allJobs.length,
    };
  }

  /**
   * Get details of a specific job.
   */
  @Get(':queueName/:jobId')
  @ApiOperation({ summary: 'Get job details' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @ApiParam({ name: 'jobId', type: 'string' })
  @ApiResponse({ status: 200, type: JobInfoResponse })
  @RequirePermission('jobs:read')
  async getJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<JobInfoResponse> {
    const queue = this.queueService.getQueue(queueName);

    if (!queue) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();
    return this.mapJobToResponse(job, queueName, state);
  }

  /**
   * Retry a failed job.
   */
  @Post('retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 200, type: RetryJobResponse })
  @RequirePermission('jobs:write')
  async retryJob(@Body() dto: RetryJobDto): Promise<RetryJobResponse> {
    const queue = this.queueService.getQueue(dto.queue);

    if (!queue) {
      throw new NotFoundException(`Queue ${dto.queue} not found`);
    }

    const job = await queue.getJob(dto.jobId);

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    const state = await job.getState();
    if (state !== 'failed') {
      throw new BadRequestException(`Job ${dto.jobId} is not in failed state (current: ${state})`);
    }

    // Retry the job
    await job.retry();

    this.logger.log(`Retried job ${dto.jobId} in queue ${dto.queue}`);

    return {
      success: true,
      newJobId: dto.jobId,
      message: 'Job requeued successfully',
    };
  }

  /**
   * Retry all failed jobs in a queue.
   */
  @Post('retry-all/:queueName')
  @ApiOperation({ summary: 'Retry all failed jobs in a queue' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @ApiResponse({ status: 200 })
  @RequirePermission('jobs:write')
  async retryAllFailed(@Param('queueName') queueName: string): Promise<{ retriedCount: number }> {
    const queue = this.queueService.getQueue(queueName);

    if (!queue) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    const failedJobs = await queue.getFailed(0, -1);
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch (error) {
        this.logger.warn(`Failed to retry job ${job.id}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Retried ${retriedCount} failed jobs in queue ${queueName}`);

    return { retriedCount };
  }

  /**
   * Add a manual job to a queue.
   */
  @Post('add')
  @ApiOperation({ summary: 'Add a manual job to a queue' })
  @ApiResponse({ status: 201, type: AddJobResponse })
  @RequirePermission('jobs:write')
  async addJob(@Body() dto: AddJobDto): Promise<AddJobResponse> {
    const jobData = {
      ...dto.data,
      tenantId: (dto.data.tenantId as string) || 'manual',
    };
    const jobId = await this.queueService.addJob(
      dto.queue,
      dto.jobType,
      jobData,
      dto.delay ? { delay: dto.delay } : undefined,
    );

    this.logger.log(`Manually added job ${jobId} to queue ${dto.queue}`);

    return {
      success: true,
      jobId,
      queue: dto.queue,
      jobType: dto.jobType,
    };
  }

  /**
   * Pause a queue.
   */
  @Post('queues/:queueName/pause')
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @RequirePermission('jobs:write')
  async pauseQueue(@Param('queueName') queueName: string): Promise<{ paused: boolean }> {
    const queue = this.queueService.getQueue(queueName);

    if (!queue) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Paused queue ${queueName}`);

    return { paused: true };
  }

  /**
   * Resume a paused queue.
   */
  @Post('queues/:queueName/resume')
  @ApiOperation({ summary: 'Resume a paused queue' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @RequirePermission('jobs:write')
  async resumeQueue(@Param('queueName') queueName: string): Promise<{ resumed: boolean }> {
    const queue = this.queueService.getQueue(queueName);

    if (!queue) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Resumed queue ${queueName}`);

    return { resumed: true };
  }

  /**
   * Clean completed/failed jobs from a queue.
   */
  @Post('queues/:queueName/clean')
  @ApiOperation({ summary: 'Clean completed/failed jobs from a queue' })
  @ApiParam({ name: 'queueName', enum: QueueNameEnum })
  @RequirePermission('jobs:write')
  async cleanQueue(
    @Param('queueName') queueName: string,
    @Query('grace') grace: number = 3600000, // 1 hour default
    @Query('type') type: 'completed' | 'failed' | 'delayed' = 'completed',
  ): Promise<{ cleaned: number }> {
    const queue = this.queueService.getQueue(queueName);

    if (!queue) {
      throw new NotFoundException(`Queue ${queueName} not found`);
    }

    const cleaned = await queue.clean(grace, 1000, type);
    this.logger.log(`Cleaned ${cleaned.length} ${type} jobs from queue ${queueName}`);

    return { cleaned: cleaned.length };
  }

  /**
   * Map a BullMQ job to our response format.
   */
  private mapJobToResponse(job: Job, queueName: string, state: string): JobInfoResponse {
    return {
      id: job.id || '',
      name: job.name,
      queue: queueName,
      state,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      attemptsMade: job.attemptsMade,
      data: job.data as Record<string, unknown>,
      result: job.returnvalue as Record<string, unknown> | undefined,
      failedReason: job.failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  }
}
