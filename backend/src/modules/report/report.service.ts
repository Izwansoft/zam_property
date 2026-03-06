/**
 * Financial Report Service
 * Session 6.8 - Phase 6 Testing & Reports
 *
 * Provides aggregated financial reports for the platform:
 * - Revenue: Platform fee income from payouts
 * - Collections: Rent collected grouped by period
 * - Outstanding: Overdue/unpaid bills with aging
 *
 * All monetary values use Decimal(12,2) for precision.
 */

import { Injectable, Logger } from '@nestjs/common';
import { RentBillingStatus, RentPaymentStatus, PayoutStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

import { ReportPeriod } from './dto';

// ─────────────────────────────────────────────────────────────────────────────
// Result interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueReportResult {
  summary: {
    totalGrossRental: number;
    totalPlatformFee: number;
    totalNetPayout: number;
    totalPayouts: number;
  };
  byPeriod: Array<{
    period: string;
    grossRental: number;
    platformFee: number;
    netPayout: number;
    payoutCount: number;
  }>;
  byOwner: Array<{
    ownerId: string;
    ownerName: string;
    grossRental: number;
    platformFee: number;
    netPayout: number;
    payoutCount: number;
  }>;
}

export interface CollectionReportResult {
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    paymentCount: number;
  };
  byPeriod: Array<{
    period: string;
    billed: number;
    collected: number;
    outstanding: number;
    paymentCount: number;
  }>;
  byMethod: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

export interface OutstandingReportResult {
  summary: {
    totalOutstanding: number;
    totalOverdue: number;
    billCount: number;
    overdueBillCount: number;
  };
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90days: number;
  };
  bills: Array<{
    billId: string;
    billNumber: string;
    tenancyId: string;
    listingTitle: string;
    tenantName: string;
    ownerName: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    dueDate: Date;
    daysOverdue: number;
    status: string;
  }>;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Report (Platform Fee Income)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Platform revenue report — aggregates payout data to show platform fee income.
   * Revenue = sum of platformFee across all COMPLETED payouts.
   */
  async getRevenueReport(options: {
    startDate?: Date;
    endDate?: Date;
    period?: ReportPeriod;
    ownerId?: string;
  }): Promise<RevenueReportResult> {
    const partnerId = this.PartnerContext.partnerId;
    const period = options.period || ReportPeriod.MONTHLY;

    // Default date range: last 12 months
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);

    const where: Prisma.OwnerPayoutWhereInput = {
      partnerId,
      status: { in: [PayoutStatus.COMPLETED, PayoutStatus.APPROVED, PayoutStatus.PROCESSING] },
      periodStart: { gte: startDate },
      periodEnd: { lte: endDate },
    };
    if (options.ownerId) {
      where.ownerId = options.ownerId;
    }

    // Fetch all relevant payouts
    const payouts = await this.prisma.ownerPayout.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { periodStart: 'asc' },
    });

    // Summary
    let totalGrossRental = 0;
    let totalPlatformFee = 0;
    let totalNetPayout = 0;

    for (const p of payouts) {
      totalGrossRental += Number(p.grossRental);
      totalPlatformFee += Number(p.platformFee);
      totalNetPayout += Number(p.netPayout);
    }

    // Group by period
    const periodMap = new Map<string, { grossRental: number; platformFee: number; netPayout: number; payoutCount: number }>();
    for (const p of payouts) {
      const key = this.formatPeriodKey(p.periodStart, period);
      const existing = periodMap.get(key) || { grossRental: 0, platformFee: 0, netPayout: 0, payoutCount: 0 };
      existing.grossRental += Number(p.grossRental);
      existing.platformFee += Number(p.platformFee);
      existing.netPayout += Number(p.netPayout);
      existing.payoutCount++;
      periodMap.set(key, existing);
    }

    // Group by owner
    const ownerMap = new Map<string, { ownerName: string; grossRental: number; platformFee: number; netPayout: number; payoutCount: number }>();
    for (const p of payouts) {
      const key = p.ownerId;
      const existing = ownerMap.get(key) || { ownerName: p.owner?.name || 'Unknown', grossRental: 0, platformFee: 0, netPayout: 0, payoutCount: 0 };
      existing.grossRental += Number(p.grossRental);
      existing.platformFee += Number(p.platformFee);
      existing.netPayout += Number(p.netPayout);
      existing.payoutCount++;
      ownerMap.set(key, existing);
    }

    this.logger.log(
      `Revenue report: ${payouts.length} payouts, platform fee MYR ${totalPlatformFee.toFixed(2)}`,
    );

    return {
      summary: {
        totalGrossRental: this.round2(totalGrossRental),
        totalPlatformFee: this.round2(totalPlatformFee),
        totalNetPayout: this.round2(totalNetPayout),
        totalPayouts: payouts.length,
      },
      byPeriod: Array.from(periodMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodKey, data]) => ({
          period: periodKey,
          grossRental: this.round2(data.grossRental),
          platformFee: this.round2(data.platformFee),
          netPayout: this.round2(data.netPayout),
          payoutCount: data.payoutCount,
        })),
      byOwner: Array.from(ownerMap.entries())
        .sort(([, a], [, b]) => b.platformFee - a.platformFee)
        .map(([ownerId, data]) => ({
          ownerId,
          ownerName: data.ownerName,
          grossRental: this.round2(data.grossRental),
          platformFee: this.round2(data.platformFee),
          netPayout: this.round2(data.netPayout),
          payoutCount: data.payoutCount,
        })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Collections Report (Rent Collected)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Rent collection report — aggregates billing and payment data.
   * Shows billed vs collected amounts with collection rate.
   */
  async getCollectionReport(options: {
    startDate?: Date;
    endDate?: Date;
    period?: ReportPeriod;
    tenancyId?: string;
  }): Promise<CollectionReportResult> {
    const partnerId = this.PartnerContext.partnerId;
    const period = options.period || ReportPeriod.MONTHLY;

    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);

    // Billing filter
    const billingWhere: Prisma.RentBillingWhereInput = {
      tenancy: { partnerId },
      issueDate: { gte: startDate, lte: endDate },
    };
    if (options.tenancyId) {
      billingWhere.tenancyId = options.tenancyId;
    }

    // Fetch billings
    const billings = await this.prisma.rentBilling.findMany({
      where: billingWhere,
      orderBy: { billingPeriod: 'asc' },
    });

    // Fetch payments for those billings
    const billingIds = billings.map((b) => b.id);
    const payments = billingIds.length > 0
      ? await this.prisma.rentPayment.findMany({
          where: {
            partnerId,
            billingId: { in: billingIds },
            status: RentPaymentStatus.COMPLETED,
          },
        })
      : [];

    // Summary
    let totalBilled = 0;
    let totalPaid = 0;
    for (const b of billings) {
      totalBilled += Number(b.totalAmount);
      totalPaid += Number(b.paidAmount);
    }
    const totalOutstanding = totalBilled - totalPaid;
    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

    // Group by period
    const periodMap = new Map<string, { billed: number; collected: number; outstanding: number; paymentCount: number }>();
    for (const b of billings) {
      const key = this.formatPeriodKey(b.billingPeriod, period);
      const existing = periodMap.get(key) || { billed: 0, collected: 0, outstanding: 0, paymentCount: 0 };
      existing.billed += Number(b.totalAmount);
      existing.collected += Number(b.paidAmount);
      existing.outstanding += Number(b.balanceDue);
      periodMap.set(key, existing);
    }
    // Add payment counts per period
    for (const p of payments) {
      const billing = billings.find((b) => b.id === p.billingId);
      if (billing) {
        const key = this.formatPeriodKey(billing.billingPeriod, period);
        const existing = periodMap.get(key);
        if (existing) existing.paymentCount++;
      }
    }

    // Group by payment method
    const methodMap = new Map<string, { amount: number; count: number }>();
    for (const p of payments) {
      const method = p.method || 'UNKNOWN';
      const existing = methodMap.get(method) || { amount: 0, count: 0 };
      existing.amount += Number(p.amount);
      existing.count++;
      methodMap.set(method, existing);
    }

    this.logger.log(
      `Collection report: billed MYR ${totalBilled.toFixed(2)}, collected MYR ${totalPaid.toFixed(2)} (${collectionRate.toFixed(1)}%)`,
    );

    return {
      summary: {
        totalBilled: this.round2(totalBilled),
        totalCollected: this.round2(totalPaid),
        totalOutstanding: this.round2(totalOutstanding),
        collectionRate: this.round2(collectionRate),
        paymentCount: payments.length,
      },
      byPeriod: Array.from(periodMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodKey, data]) => ({
          period: periodKey,
          billed: this.round2(data.billed),
          collected: this.round2(data.collected),
          outstanding: this.round2(data.outstanding),
          paymentCount: data.paymentCount,
        })),
      byMethod: Array.from(methodMap.entries())
        .sort(([, a], [, b]) => b.amount - a.amount)
        .map(([method, data]) => ({
          method,
          amount: this.round2(data.amount),
          count: data.count,
        })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Outstanding Report (Overdue Bills)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Outstanding bills report — shows all unpaid/overdue bills with aging buckets.
   */
  async getOutstandingReport(options: {
    asOfDate?: Date;
    ownerId?: string;
    tenancyId?: string;
  }): Promise<OutstandingReportResult> {
    const partnerId = this.PartnerContext.partnerId;
    const asOfDate = options.asOfDate || new Date();

    const where: Prisma.RentBillingWhereInput = {
      tenancy: { partnerId },
      status: {
        in: [
          RentBillingStatus.GENERATED,
          RentBillingStatus.SENT,
          RentBillingStatus.PARTIALLY_PAID,
          RentBillingStatus.OVERDUE,
        ],
      },
      balanceDue: { gt: 0 },
    };

    if (options.tenancyId) {
      where.tenancyId = options.tenancyId;
    }
    if (options.ownerId) {
      where.tenancy = {
        ...where.tenancy as object,
        ownerId: options.ownerId,
      };
    }

    const billings = await this.prisma.rentBilling.findMany({
      where,
      include: {
        tenancy: {
          select: {
            id: true,
            listing: { select: { title: true } },
            owner: { select: { name: true } },
            tenant: { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Summary
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueBillCount = 0;

    // Aging buckets
    const aging = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90days: 0 };

    const billDetails: OutstandingReportResult['bills'] = [];

    for (const b of billings) {
      const balance = Number(b.balanceDue);
      totalOutstanding += balance;

      const daysOverdue = Math.max(
        0,
        Math.floor((asOfDate.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      if (daysOverdue > 0) {
        totalOverdue += balance;
        overdueBillCount++;
      }

      // Aging bucket
      if (daysOverdue <= 0) {
        aging.current += balance;
      } else if (daysOverdue <= 30) {
        aging.days1to30 += balance;
      } else if (daysOverdue <= 60) {
        aging.days31to60 += balance;
      } else if (daysOverdue <= 90) {
        aging.days61to90 += balance;
      } else {
        aging.over90days += balance;
      }

      billDetails.push({
        billId: b.id,
        billNumber: b.billNumber,
        tenancyId: b.tenancyId,
        listingTitle: b.tenancy?.listing?.title || '',
        tenantName: b.tenancy?.tenant?.user?.fullName || '',
        ownerName: b.tenancy?.owner?.name || '',
        totalAmount: Number(b.totalAmount),
        paidAmount: Number(b.paidAmount),
        balanceDue: balance,
        dueDate: b.dueDate,
        daysOverdue,
        status: b.status,
      });
    }

    this.logger.log(
      `Outstanding report: ${billings.length} bills, MYR ${totalOutstanding.toFixed(2)} outstanding, ${overdueBillCount} overdue`,
    );

    return {
      summary: {
        totalOutstanding: this.round2(totalOutstanding),
        totalOverdue: this.round2(totalOverdue),
        billCount: billings.length,
        overdueBillCount,
      },
      aging: {
        current: this.round2(aging.current),
        days1to30: this.round2(aging.days1to30),
        days31to60: this.round2(aging.days31to60),
        days61to90: this.round2(aging.days61to90),
        over90days: this.round2(aging.over90days),
      },
      bills: billDetails,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Format a date into a period key string for grouping.
   */
  private formatPeriodKey(date: Date, period: ReportPeriod): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    switch (period) {
      case ReportPeriod.DAILY:
        return `${yyyy}-${mm}-${dd}`;
      case ReportPeriod.WEEKLY: {
        // ISO week: Monday-based week start
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        const ws = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        return `W-${ws}`;
      }
      case ReportPeriod.MONTHLY:
        return `${yyyy}-${mm}`;
      case ReportPeriod.QUARTERLY: {
        const quarter = Math.ceil((d.getMonth() + 1) / 3);
        return `${yyyy}-Q${quarter}`;
      }
      case ReportPeriod.YEARLY:
        return `${yyyy}`;
      case ReportPeriod.CUSTOM:
      default:
        return `${yyyy}-${mm}`;
    }
  }

  /**
   * Round to 2 decimal places for financial precision.
   */
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
