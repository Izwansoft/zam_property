import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job, Worker, WorkerOptions } from 'bullmq';
import { QUEUE_CONCURRENCY, JOB_TIMEOUTS } from './queue.config';
import { BaseJobData, JobResult } from './queue.interfaces';

/**
 * Abstract base class for queue processors.
 * Extend this class to create domain-specific processors.
 *
 * Per part-31.md:
 * - Processors must handle failures gracefully with retries
 * - Update progress during long-running jobs
 * - Log start/complete/fail events
 */
export abstract class BaseProcessor<T extends BaseJobData = BaseJobData>
  implements OnModuleInit, OnModuleDestroy
{
  protected abstract readonly queueName: string;
  protected abstract readonly logger: Logger;
  protected worker!: Worker<T, JobResult>;

  /**
   * Redis connection configuration.
   * Override in subclass to provide connection details.
   */
  protected abstract getConnectionConfig(): {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };

  /**
   * Process a job. Implement this in subclass.
   *
   * @param job - The job to process
   * @returns Job result
   */
  protected abstract processJob(job: Job<T>): Promise<JobResult>;

  /**
   * Get worker options. Override to customize.
   */
  protected getWorkerOptions(): Partial<WorkerOptions> {
    return {};
  }

  async onModuleInit(): Promise<void> {
    const connectionConfig = this.getConnectionConfig();
    const concurrency = QUEUE_CONCURRENCY[this.queueName as keyof typeof QUEUE_CONCURRENCY] ?? 5;

    this.worker = new Worker<T, JobResult>(this.queueName, async (job) => this.handleJob(job), {
      connection: connectionConfig,
      concurrency,
      ...this.getWorkerOptions(),
    });

    this.worker.on('completed', (job) => {
      this.logger.log({
        event: 'job.completed',
        queue: this.queueName,
        jobId: job.id,
        jobType: job.name,
        tenantId: job.data.tenantId,
      });
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error({
        event: 'job.failed',
        queue: this.queueName,
        jobId: job?.id,
        jobType: job?.name,
        tenantId: job?.data?.tenantId,
        error: error.message,
        attempts: job?.attemptsMade,
      });
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Worker error: ${error.message}`);
    });

    this.logger.log(`Worker started for queue: ${this.queueName} (concurrency: ${concurrency})`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      this.logger.log(`Shutting down worker for queue: ${this.queueName}`);
      await this.worker.close();
    }
  }

  /**
   * Handle a job with logging and error handling.
   */
  private async handleJob(job: Job<T>): Promise<JobResult> {
    const startTime = Date.now();

    this.logger.log({
      event: 'job.started',
      queue: this.queueName,
      jobId: job.id,
      jobType: job.name,
      tenantId: job.data.tenantId,
    });

    try {
      // Set job timeout if configured
      const timeout = JOB_TIMEOUTS[job.name];
      if (timeout) {
        // BullMQ handles timeout via job options, but we log for visibility
        this.logger.debug(`Job ${job.id} has timeout of ${timeout}ms`);
      }

      const result = await this.processJob(job);

      this.logger.log({
        event: 'job.processed',
        queue: this.queueName,
        jobId: job.id,
        jobType: job.name,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.error',
        queue: this.queueName,
        jobId: job.id,
        jobType: job.name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });

      throw error; // Re-throw for BullMQ retry handling
    }
  }

  /**
   * Update job progress.
   * Call this during long-running jobs to report progress.
   */
  protected async updateProgress(job: Job<T>, progress: number): Promise<void> {
    await job.updateProgress(progress);
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }
}
