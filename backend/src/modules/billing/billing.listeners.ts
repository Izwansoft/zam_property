import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RentBillingStatus, TenancyStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';

/**
 * Event listeners for billing module.
 *
 * These are singleton-scoped (no PartnerContextService dependency)
 * so they can respond to domain events without a request context.
 */
@Injectable()
export class BillingEventListeners {
  private readonly logger = new Logger(BillingEventListeners.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * When a tenancy becomes ACTIVE, auto-generate the first month's rent bill.
   *
   * This ensures the tenant gets billed immediately upon tenancy activation
   * rather than waiting for the monthly cron job to pick it up.
   */
  @OnEvent('tenancy.activated')
  async handleTenancyActivated(event: {
    tenancyId: string;
    partnerId: string;
  }): Promise<void> {
    try {
      const tenancy = await this.prisma.tenancy.findFirst({
        where: { id: event.tenancyId, partnerId: event.partnerId },
        select: {
          id: true,
          status: true,
          monthlyRent: true,
          billingDay: true,
          paymentDueDay: true,
          lateFeePercent: true,
          leaseStartDate: true,
          listing: { select: { id: true, title: true } },
          owner: { select: { id: true, name: true, email: true } },
          tenant: {
            select: {
              id: true,
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      });

      if (!tenancy) {
        this.logger.warn(`Tenancy ${event.tenancyId} not found for initial billing`);
        return;
      }

      // Determine billing period (current month)
      const now = new Date();
      const billingPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

      // Check if bill already exists for this period
      const existingBill = await this.prisma.rentBilling.findFirst({
        where: {
          tenancyId: event.tenancyId,
          billingPeriod,
        },
        select: { id: true, billNumber: true },
      });

      if (existingBill) {
        this.logger.debug(
          `Bill already exists for tenancy ${event.tenancyId} for period ` +
            `${billingPeriod.toISOString().slice(0, 7)}: ${existingBill.billNumber}`,
        );
        return;
      }

      // Generate bill number
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prefix = `BILL-${yearMonth}`;
      const count = await this.prisma.rentBilling.count({
        where: {
          billNumber: { startsWith: prefix },
          tenancy: { partnerId: event.partnerId },
        },
      });
      const billNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;

      // Calculate amounts
      const rentAmount = Number(tenancy.monthlyRent);
      const totalAmount = rentAmount;
      const issueDate = now;
      const dueDate = new Date(billingPeriod);
      dueDate.setUTCDate(tenancy.billingDay + tenancy.paymentDueDay);

      // Create bill
      const billing = await this.prisma.$transaction(async (tx) => {
        return tx.rentBilling.create({
          data: {
            tenancyId: event.tenancyId,
            billNumber,
            billingPeriod,
            status: RentBillingStatus.GENERATED,
            rentAmount,
            lateFee: 0,
            adjustments: 0,
            totalAmount,
            paidAmount: 0,
            balanceDue: totalAmount,
            issueDate,
            dueDate,
            lineItems: {
              create: [
                {
                  description: `Monthly rent for ${billingPeriod.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}`,
                  type: 'RENT',
                  amount: rentAmount,
                },
              ],
            },
          },
          include: { lineItems: true },
        });
      });

      this.logger.log(
        `Auto-generated initial bill ${billNumber} for tenancy ${event.tenancyId}: RM${totalAmount.toFixed(2)}`,
      );

      // Emit billing.generated event for notifications
      this.eventEmitter.emit('billing.generated', {
        billingId: billing.id,
        tenancyId: event.tenancyId,
        partnerId: event.partnerId,
        billNumber,
        totalAmount,
        tenantUserId: tenancy.tenant.user.id,
        tenantEmail: tenancy.tenant.user.email,
        tenantName: tenancy.tenant.user.fullName,
        ownerName: tenancy.owner.name,
        propertyTitle: tenancy.listing.title,
        dueDate: dueDate.toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to auto-generate initial billing for tenancy ${event.tenancyId}: ${(error as Error).message}`,
      );
    }
  }
}
