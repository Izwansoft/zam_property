import { ApiProperty } from '@nestjs/swagger';

export class AdminSystemHealthQueueStatDto {
  @ApiProperty({ example: 'analytics.process' })
  name!: string;

  @ApiProperty({ example: 0 })
  waiting!: number;

  @ApiProperty({ example: 0 })
  active!: number;

  @ApiProperty({ example: 120 })
  completed!: number;

  @ApiProperty({ example: 2 })
  failed!: number;

  @ApiProperty({ example: 0 })
  delayed!: number;
}

export class AdminSystemHealthDto {
  @ApiProperty({ example: 'healthy', enum: ['healthy', 'degraded', 'unhealthy'] })
  status!: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({ example: true })
  databaseConnected!: boolean;

  @ApiProperty({ example: true })
  redisConnected!: boolean;

  @ApiProperty({ type: [AdminSystemHealthQueueStatDto] })
  queues!: AdminSystemHealthQueueStatDto[];

  @ApiProperty({ description: 'ISO timestamp', example: '2026-01-21T00:00:00.000Z' })
  timestamp!: string;
}
