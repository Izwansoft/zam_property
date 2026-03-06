import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES } from './queue.constants';
import { DEFAULT_JOB_OPTIONS, JOB_OPTIONS_BY_PRIORITY } from './queue.config';
import { BaseJobData } from './queue.interfaces';

/**
 * Queue service for managing BullMQ queues.
 * Provides methods to add jobs to queues with proper configuration.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redisService: RedisService) {
    // Initialize queues
    this.initializeQueues();
  }

  /**
   * Initialize all defined queues.
   */
  private initializeQueues(): void {
    const connectionOptions = this.redisService.getConnectionOptions();

    for (const queueName of Object.values(QUEUE_NAMES)) {
      const queue = new Queue(queueName, {
        connection: connectionOptions,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });

      this.queues.set(queueName, queue);
      this.logger.log(`Queue initialized: ${queueName}`);
    }
  }

  /**
   * Get a queue by name.
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Add a job to a queue.
   *
   * @param queueName - Name of the queue
   * @param jobType - Type of job (e.g., "image.resize")
   * @param data - Job payload
   * @param options - Optional job options
   */
  async addJob<T extends BaseJobData>(
    queueName: string,
    jobType: string,
    data: T,
    options?: JobsOptions,
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const jobData = {
      ...data,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };

    const job = await queue.add(jobType, jobData, options);

    this.logger.debug({
      event: 'job.added',
      queue: queueName,
      jobId: job.id,
      jobType,
      partnerId: data.partnerId,
    });

    return job.id!;
  }

  /**
   * Add a high-priority job.
   */
  async addHighPriorityJob<T extends BaseJobData>(
    queueName: string,
    jobType: string,
    data: T,
  ): Promise<string> {
    return this.addJob(queueName, jobType, data, JOB_OPTIONS_BY_PRIORITY.high);
  }

  /**
   * Add a low-priority job.
   */
  async addLowPriorityJob<T extends BaseJobData>(
    queueName: string,
    jobType: string,
    data: T,
  ): Promise<string> {
    return this.addJob(queueName, jobType, data, JOB_OPTIONS_BY_PRIORITY.low);
  }

  /**
   * Add a delayed job.
   *
   * @param queueName - Name of the queue
   * @param jobType - Type of job
   * @param data - Job payload
   * @param delayMs - Delay in milliseconds
   */
  async addDelayedJob<T extends BaseJobData>(
    queueName: string,
    jobType: string,
    data: T,
    delayMs: number,
  ): Promise<string> {
    return this.addJob(queueName, jobType, data, { delay: delayMs });
  }

  /**
   * Add a debounced job (prevents duplicates within window).
   *
   * @param queueName - Name of the queue
   * @param jobType - Type of job
   * @param jobId - Unique job ID for deduplication
   * @param data - Job payload
   * @param delayMs - Debounce delay in milliseconds
   */
  async addDebouncedJob<T extends BaseJobData>(
    queueName: string,
    jobType: string,
    jobId: string,
    data: T,
    delayMs = 5000,
  ): Promise<string> {
    return this.addJob(queueName, jobType, data, {
      jobId,
      delay: delayMs,
    });
  }

  /**
   * Add multiple jobs in bulk.
   */
  async addBulkJobs<T extends BaseJobData>(
    queueName: string,
    jobs: Array<{ type: string; data: T; options?: JobsOptions }>,
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const bulkJobs = jobs.map((job) => ({
      name: job.type,
      data: {
        ...job.data,
        createdAt: job.data.createdAt ?? new Date().toISOString(),
      },
      opts: job.options,
    }));

    const addedJobs = await queue.addBulk(bulkJobs);

    this.logger.debug({
      event: 'jobs.bulk_added',
      queue: queueName,
      count: addedJobs.length,
    });

    return addedJobs.map((job) => job.id!);
  }

  /**
   * Get queue health stats.
   */
  async getQueueStats(queueName: string): Promise<{
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Get all queues health stats.
   */
  async getAllQueuesStats(): Promise<
    Array<{
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }>
  > {
    const stats = await Promise.all(
      Array.from(this.queues.keys()).map((name) => this.getQueueStats(name)),
    );
    return stats.filter((s): s is NonNullable<typeof s> => s !== null);
  }

  /**
   * Close all queues gracefully.
   */
  async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues) {
      this.logger.log(`Closing queue: ${name}`);
      await queue.close();
    }
  }
}
