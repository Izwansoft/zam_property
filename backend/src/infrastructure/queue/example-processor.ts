import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseProcessor } from './base-processor';
import { BaseJobData, JobResult } from './queue.interfaces';
import { QUEUE_NAMES } from './queue.constants';
import { RedisService } from '../redis/redis.service';

/**
 * Example processor template.
 * Copy this file and customize for your domain-specific processor.
 *
 * Usage:
 * 1. Rename the class to match your domain (e.g., MediaProcessor)
 * 2. Update queueName to your queue
 * 3. Implement processJob() with your business logic
 * 4. Add the processor to your domain module's providers
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [YourProcessor],
 * })
 * export class YourModule {}
 * ```
 */
@Injectable()
export class ExampleProcessor extends BaseProcessor<ExampleJobData> {
  protected readonly queueName = QUEUE_NAMES.CLEANUP_PROCESS; // Change to your queue
  protected readonly logger = new Logger(ExampleProcessor.name);

  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * Provide Redis connection config.
   */
  protected getConnectionConfig() {
    return this.redisService.getConnectionOptions();
  }

  /**
   * Process a job.
   * Implement your business logic here.
   */
  protected async processJob(job: Job<ExampleJobData>): Promise<JobResult> {
    const { partnerId, itemId } = job.data;

    // Update progress (for long-running jobs)
    await this.updateProgress(job, 10);

    // Step 1: Validate
    this.logger.debug(`Processing item ${itemId} for partner ${partnerId}`);
    await this.updateProgress(job, 30);

    // Step 2: Do work
    // ... your business logic here ...
    await this.updateProgress(job, 70);

    // Step 3: Finalize
    // ... save results, emit events, etc. ...
    await this.updateProgress(job, 100);

    return {
      success: true,
      message: `Processed item ${itemId}`,
      data: { itemId },
      processedAt: new Date().toISOString(),
    };
  }
}

/**
 * Example job data interface.
 * Define your job-specific payload here.
 */
interface ExampleJobData extends BaseJobData {
  itemId: string;
  action: string;
}
