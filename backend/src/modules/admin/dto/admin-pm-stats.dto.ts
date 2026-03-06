import { ApiProperty } from '@nestjs/swagger';

import { StatusCountDto } from './admin-dashboard-stats.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-section DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class TenancyStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Tenancies by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Total active tenancies', example: 85 })
  activeCount!: number;

  @ApiProperty({ description: 'Tenancies expiring within 30 days', example: 5 })
  expiringSoonCount!: number;

  @ApiProperty({ description: 'Total tenancies', example: 120 })
  totalCount!: number;
}

export class BillingStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Bills by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Total overdue bills', example: 12 })
  overdueCount!: number;

  @ApiProperty({ description: 'Total overdue amount (RM)', example: '15600.00' })
  overdueAmount!: string;

  @ApiProperty({ description: 'Total collected this month (RM)', example: '97800.00' })
  collectedThisMonth!: string;

  @ApiProperty({ description: 'Total billed this month (RM)', example: '125000.00' })
  billedThisMonth!: string;
}

export class MaintenanceStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Tickets by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ type: [StatusCountDto], description: 'Tickets by priority' })
  byPriority!: StatusCountDto[];

  @ApiProperty({ description: 'Open tickets (not CLOSED/CANCELLED)', example: 23 })
  openCount!: number;

  @ApiProperty({ description: 'Unassigned tickets (OPEN + VERIFIED)', example: 8 })
  unassignedCount!: number;
}

export class PayoutStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Payouts by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Pending approval amount (RM)', example: '45200.00' })
  pendingApprovalAmount!: string;

  @ApiProperty({ description: 'Processed this month (RM)', example: '128500.00' })
  processedThisMonth!: string;
}

export class DepositStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Deposits by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Total held amount (RM)', example: '256000.00' })
  totalHeldAmount!: string;

  @ApiProperty({ description: 'Pending refund count', example: 4 })
  pendingRefundCount!: number;
}

export class InspectionStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Inspections by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Upcoming inspections (SCHEDULED)', example: 7 })
  upcomingCount!: number;

  @ApiProperty({ description: 'Completed this month', example: 15 })
  completedThisMonth!: number;
}

export class ClaimStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Claims by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Pending review count', example: 6 })
  pendingReviewCount!: number;

  @ApiProperty({ description: 'Disputed claims count', example: 2 })
  disputedCount!: number;
}

export class LegalStatsDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Legal cases by status' })
  byStatus!: StatusCountDto[];

  @ApiProperty({ description: 'Open cases (not CLOSED)', example: 3 })
  openCount!: number;
}

export class TenantStatsDto {
  @ApiProperty({ description: 'Total tenants', example: 95 })
  totalCount!: number;

  @ApiProperty({ description: 'Active tenants (with active tenancy)', example: 82 })
  activeCount!: number;
}

export class CompanyAgentStatsDto {
  @ApiProperty({ description: 'Total companies', example: 12 })
  totalCompanies!: number;

  @ApiProperty({ description: 'Active companies', example: 9 })
  activeCompanies!: number;

  @ApiProperty({ description: 'Total agents', example: 45 })
  totalAgents!: number;

  @ApiProperty({ description: 'Active agents', example: 38 })
  activeAgents!: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root DTO
// ─────────────────────────────────────────────────────────────────────────────

export class PropertyManagementStatsDto {
  @ApiProperty({ type: TenancyStatsDto })
  tenancy!: TenancyStatsDto;

  @ApiProperty({ type: BillingStatsDto })
  billing!: BillingStatsDto;

  @ApiProperty({ type: MaintenanceStatsDto })
  maintenance!: MaintenanceStatsDto;

  @ApiProperty({ type: PayoutStatsDto })
  payout!: PayoutStatsDto;

  @ApiProperty({ type: DepositStatsDto })
  deposit!: DepositStatsDto;

  @ApiProperty({ type: InspectionStatsDto })
  inspection!: InspectionStatsDto;

  @ApiProperty({ type: ClaimStatsDto })
  claim!: ClaimStatsDto;

  @ApiProperty({ type: LegalStatsDto })
  legal!: LegalStatsDto;

  @ApiProperty({ type: TenantStatsDto })
  tenant!: TenantStatsDto;

  @ApiProperty({ type: CompanyAgentStatsDto })
  companyAgent!: CompanyAgentStatsDto;

  @ApiProperty({ description: 'ISO timestamp', example: '2026-02-23T00:00:00.000Z' })
  generatedAt!: string;
}
