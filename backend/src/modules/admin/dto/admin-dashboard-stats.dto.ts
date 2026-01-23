import { ApiProperty } from '@nestjs/swagger';

export class StatusCountDto {
  @ApiProperty({ description: 'Status key', example: 'PUBLISHED' })
  status!: string;

  @ApiProperty({ description: 'Count for the status', example: 42 })
  count!: number;
}

export class TenantDashboardStatsDto {
  @ApiProperty({ type: [StatusCountDto] })
  vendorsByStatus!: StatusCountDto[];

  @ApiProperty({ type: [StatusCountDto] })
  listingsByStatus!: StatusCountDto[];

  @ApiProperty({ type: [StatusCountDto] })
  interactionsLast7DaysByType!: StatusCountDto[];

  @ApiProperty({ description: 'Pending vendor approvals', example: 3 })
  pendingVendors!: number;

  @ApiProperty({ description: 'Pending review moderation items', example: 7 })
  pendingReviews!: number;

  @ApiProperty({ description: 'ISO timestamp', example: '2026-01-21T00:00:00.000Z' })
  generatedAt!: string;
}
