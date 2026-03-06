import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Queue names enum for validation.
 */
export enum QueueNameEnum {
  MEDIA_PROCESS = 'media.process',
  SEARCH_INDEX = 'search.index',
  NOTIFICATION_SEND = 'notification.send',
  BILLING_PROCESS = 'billing.process',
  CLEANUP_PROCESS = 'cleanup.process',
  ANALYTICS_PROCESS = 'analytics.process',
  DATA_TRANSFER = 'data.transfer',
  LISTING_EXPIRE = 'listing.expire',
}

/**
 * Job state enum.
 */
export enum JobStateEnum {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

/**
 * Response for single queue stats.
 */
export class QueueStatsResponse {
  @ApiProperty({ example: 'media.process' })
  name!: string;

  @ApiProperty({ example: 5 })
  waiting!: number;

  @ApiProperty({ example: 2 })
  active!: number;

  @ApiProperty({ example: 1000 })
  completed!: number;

  @ApiProperty({ example: 3 })
  failed!: number;

  @ApiProperty({ example: 10 })
  delayed!: number;

  @ApiProperty({ example: false })
  isPaused!: boolean;
}

/**
 * Response for all queues health.
 */
export class QueuesHealthResponse {
  @ApiProperty({ type: [QueueStatsResponse] })
  queues!: QueueStatsResponse[];

  @ApiProperty({ example: '2026-01-21T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'healthy' })
  status!: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Job info response.
 */
export class JobInfoResponse {
  @ApiProperty({ example: '123' })
  id!: string;

  @ApiProperty({ example: 'image.resize' })
  name!: string;

  @ApiProperty({ example: 'media.process' })
  queue!: string;

  @ApiProperty({ example: 'completed' })
  state!: string;

  @ApiProperty({ example: 50 })
  progress!: number;

  @ApiProperty({ example: 1 })
  attemptsMade!: number;

  @ApiProperty({ example: { mediaId: 'abc123', partnerId: 'partner-1' } })
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ example: { success: true } })
  result?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Error message' })
  failedReason?: string;

  @ApiProperty({ example: '2026-01-21T12:00:00.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ example: '2026-01-21T12:00:05.000Z' })
  processedAt?: string;

  @ApiPropertyOptional({ example: '2026-01-21T12:00:10.000Z' })
  finishedAt?: string;
}

/**
 * Query params for listing jobs.
 */
export class ListJobsQueryDto {
  @ApiPropertyOptional({ enum: QueueNameEnum })
  @IsOptional()
  @IsEnum(QueueNameEnum)
  queue?: QueueNameEnum;

  @ApiPropertyOptional({ enum: JobStateEnum })
  @IsOptional()
  @IsEnum(JobStateEnum)
  state?: JobStateEnum;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * DTO for retrying a failed job.
 */
export class RetryJobDto {
  @ApiProperty({ description: 'Queue name' })
  @IsString()
  @IsEnum(QueueNameEnum)
  queue!: QueueNameEnum;

  @ApiProperty({ description: 'Job ID to retry' })
  @IsString()
  jobId!: string;
}

/**
 * DTO for adding a manual job.
 */
export class AddJobDto {
  @ApiProperty({ enum: QueueNameEnum })
  @IsEnum(QueueNameEnum)
  queue!: QueueNameEnum;

  @ApiProperty({ example: 'bulk.reindex' })
  @IsString()
  jobType!: string;

  @ApiProperty({ example: { partnerId: 'partner-1', type: 'bulk.reindex' } })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delay?: number;
}

/**
 * Response for job retry.
 */
export class RetryJobResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '456' })
  newJobId!: string;

  @ApiProperty({ example: 'Job requeued successfully' })
  message!: string;
}

/**
 * Response for adding a job.
 */
export class AddJobResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '789' })
  jobId!: string;

  @ApiProperty({ example: 'media.process' })
  queue!: string;

  @ApiProperty({ example: 'bulk.reindex' })
  jobType!: string;
}
