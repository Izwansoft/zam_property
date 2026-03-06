import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RentBillingStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { PartnerContextService } from '@core/partner-context';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Reminder status values */
export type ReminderStatus = 'SENT' | 'DELIVERED' | 'FAILED' | 'ACKNOWLEDGED';

/** Reminder channel (matches RentBillingReminderType enum) */
export type ReminderChannel = 'EMAIL' | 'SMS' | 'LETTER' | 'LEGAL_NOTICE';

/** Schedule definition for a reminder sequence */
export interface ReminderScheduleRule {
  sequence: number;
  label: string;
  /** Offset in days relative to due date. Negative = before, 0 = on, positive = after */
  dayOffset: number;
  /** Channel. Sequence 4 automatically uses LEGAL_NOTICE. */
  channel: ReminderChannel;
  /** If true, flag billing for legal escalation */
  escalate: boolean;
}

/** Default reminder schedule */
export const REMINDER_SCHEDULE: ReminderScheduleRule[] = [
  { sequence: 1, label: '1st reminder (3 days before due)', dayOffset: -3, channel: 'EMAIL', escalate: false },
  { sequence: 2, label: '2nd reminder (on due date)', dayOffset: 0, channel: 'EMAIL', escalate: false },
  { sequence: 3, label: '3rd reminder (7 days overdue)', dayOffset: 7, channel: 'EMAIL', escalate: false },
  { sequence: 4, label: 'Legal notice (14 days overdue)', dayOffset: 14, channel: 'LEGAL_NOTICE', escalate: true },
];

/** View type for a reminder record */
export interface ReminderView {
  id: string;
  billingId: string;
  sequence: number;
  type: string;
  status: string;
  sentAt: Date;
  sentTo: string;
  response: string | null;
  respondedAt: Date | null;
  escalatedAt: Date | null;
  escalatedTo: string | null;
  createdAt: Date;
}

/** Result of sending a reminder */
export interface SendReminderResult {
  reminderId: string;
  billingId: string;
  billNumber: string;
  sequence: number;
  channel: ReminderChannel;
  sentTo: string;
  escalated: boolean;
}

/** Result of scheduling a reminder run */
export interface ScheduleRemindersResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  escalated: number;
  details: Array<{
    billingId: string;
    billNumber: string;
    sequence: number;
    action: 'SENT' | 'SKIPPED' | 'FAILED' | 'ESCALATED';
    reason?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Billing statuses that qualify for reminders (unpaid bills) */
const REMINDER_ELIGIBLE_STATUSES: RentBillingStatus[] = [
  RentBillingStatus.GENERATED,
  RentBillingStatus.SENT,
  RentBillingStatus.PARTIALLY_PAID,
  RentBillingStatus.OVERDUE,
];

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Send Reminder (manual or automated)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a reminder for a specific billing at a given sequence.
   * If sequence is omitted, automatically determines the next sequence to send.
   */
  async sendReminder(
    billingId: string,
    sequence?: number,
  ): Promise<SendReminderResult> {
    const partnerId = this.PartnerContext.partnerId;

    // Fetch billing with tenancy + tenant info
    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: billingId },
      include: {
        tenancy: {
          include: {
            tenant: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
            listing: { select: { id: true, title: true } },
          },
        },
        reminders: {
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    // Cannot remind on paid or written-off bills
    if (!REMINDER_ELIGIBLE_STATUSES.includes(billing.status)) {
      throw new BadRequestException(
        `Cannot send reminder for billing in ${billing.status} status`,
      );
    }

    // Determine sequence
    const lastSequence = billing.reminders[0]?.sequence || 0;
    const targetSequence = sequence ?? lastSequence + 1;

    if (targetSequence < 1 || targetSequence > 4) {
      throw new BadRequestException(
        `Reminder sequence must be between 1 and 4. Current: ${lastSequence}`,
      );
    }

    // Check for duplicate
    const existingReminder = await this.prisma.rentBillingReminder.findFirst({
      where: { billingId, sequence: targetSequence },
    });
    if (existingReminder) {
      throw new BadRequestException(
        `Reminder sequence ${targetSequence} already sent for billing ${billing.billNumber}`,
      );
    }

    // Resolve schedule rule
    const rule = REMINDER_SCHEDULE.find((r) => r.sequence === targetSequence);
    if (!rule) {
      throw new BadRequestException(`No schedule rule for sequence ${targetSequence}`);
    }

    const tenantEmail =
      billing.tenancy?.tenant?.user?.email || '';
    const tenantName =
      billing.tenancy?.tenant?.user?.fullName || '';
    const sentTo = tenantEmail;

    if (!sentTo) {
      throw new BadRequestException('Tenant email not available for reminder');
    }

    const now = new Date();
    const isEscalation = rule.escalate;

    // Create reminder record
    const reminder = await this.prisma.rentBillingReminder.create({
      data: {
        partnerId,
        billingId,
        sequence: targetSequence,
        type: rule.channel,
        status: 'SENT',
        sentAt: now,
        sentTo,
        escalatedAt: isEscalation ? now : null,
        escalatedTo: isEscalation ? 'Legal Team' : null,
      },
    });

    // Emit event for notification system
    this.eventEmitter.emit('billing.reminder.sent', {
      partnerId,
      billingId,
      billNumber: billing.billNumber,
      reminderId: reminder.id,
      sequence: targetSequence,
      channel: rule.channel,
      sentTo,
      tenantName,
      tenantEmail,
      balanceDue: Number(billing.balanceDue),
      dueDate: billing.dueDate,
      listingTitle: billing.tenancy?.listing?.title || '',
      isLegalNotice: isEscalation,
    });

    // If escalation (sequence 4), emit legal escalation event
    if (isEscalation) {
      this.eventEmitter.emit('billing.escalated.legal', {
        partnerId,
        tenancyId: billing.tenancyId,
        billingId,
        billNumber: billing.billNumber,
        reminderId: reminder.id,
        amountOwed: Number(billing.balanceDue),
        tenantName,
        tenantEmail,
        dueDate: billing.dueDate,
        overdueDays: Math.floor(
          (now.getTime() - billing.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      });

      this.logger.warn(
        `Legal escalation triggered for billing ${billing.billNumber}: ` +
        `overdue by ${Math.floor((now.getTime() - billing.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
      );
    }

    this.logger.log(
      `Reminder #${targetSequence} sent for billing ${billing.billNumber} to ${sentTo}` +
      (isEscalation ? ' [LEGAL ESCALATION]' : ''),
    );

    return {
      reminderId: reminder.id,
      billingId,
      billNumber: billing.billNumber,
      sequence: targetSequence,
      channel: rule.channel,
      sentTo,
      escalated: isEscalation,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Schedule Reminders (batch — called by cron)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Scan all unpaid billings and send appropriate reminders based on schedule.
   * For each billing, determines which reminder sequence is due and sends it.
   *
   * Called by the scheduler cron job (daily at 7 AM).
   */
  async scheduleReminders(partnerId: string): Promise<ScheduleRemindersResult> {
    const now = new Date();
    const result: ScheduleRemindersResult = {
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      escalated: 0,
      details: [],
    };

    // Find all unpaid billings for this partner
    const billings = await this.prisma.rentBilling.findMany({
      where: {
        tenancy: { partnerId },
        status: { in: REMINDER_ELIGIBLE_STATUSES },
      },
      include: {
        tenancy: {
          include: {
            tenant: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
            listing: { select: { id: true, title: true } },
          },
        },
        reminders: {
          orderBy: { sequence: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    for (const billing of billings) {
      result.processed++;

      const lastSequence = billing.reminders[0]?.sequence || 0;
      const dueDate = billing.dueDate;

      // Determine which reminder(s) should have been sent by now
      let nextSequence: number | null = null;

      for (const rule of REMINDER_SCHEDULE) {
        if (rule.sequence <= lastSequence) continue;

        const triggerDate = new Date(dueDate);
        triggerDate.setDate(triggerDate.getDate() + rule.dayOffset);

        if (now >= triggerDate) {
          nextSequence = rule.sequence;
          break; // Send only the next due one per run
        }
      }

      if (nextSequence === null) {
        result.skipped++;
        result.details.push({
          billingId: billing.id,
          billNumber: billing.billNumber,
          sequence: lastSequence,
          action: 'SKIPPED',
          reason: 'No reminder due yet',
        });
        continue;
      }

      // Get tenant info
      const tenantEmail = billing.tenancy?.tenant?.user?.email;
      if (!tenantEmail) {
        result.failed++;
        result.details.push({
          billingId: billing.id,
          billNumber: billing.billNumber,
          sequence: nextSequence,
          action: 'FAILED',
          reason: 'No tenant email available',
        });
        continue;
      }

      try {
        const rule = REMINDER_SCHEDULE.find((r) => r.sequence === nextSequence)!;
        const tenantName = billing.tenancy?.tenant?.user?.fullName || '';
        const isEscalation = rule.escalate;

        // Create reminder record
        const reminder = await this.prisma.rentBillingReminder.create({
          data: {
            partnerId,
            billingId: billing.id,
            sequence: nextSequence,
            type: rule.channel,
            status: 'SENT',
            sentAt: now,
            sentTo: tenantEmail,
            escalatedAt: isEscalation ? now : null,
            escalatedTo: isEscalation ? 'Legal Team' : null,
          },
        });

        // Emit notification event
        this.eventEmitter.emit('billing.reminder.sent', {
          partnerId,
          billingId: billing.id,
          billNumber: billing.billNumber,
          reminderId: reminder.id,
          sequence: nextSequence,
          channel: rule.channel,
          sentTo: tenantEmail,
          tenantName,
          tenantEmail,
          balanceDue: Number(billing.balanceDue),
          dueDate: billing.dueDate,
          listingTitle: billing.tenancy?.listing?.title || '',
          isLegalNotice: isEscalation,
        });

        if (isEscalation) {
          this.eventEmitter.emit('billing.escalated.legal', {
            partnerId,
            tenancyId: billing.tenancyId,
            billingId: billing.id,
            billNumber: billing.billNumber,
            reminderId: reminder.id,
            amountOwed: Number(billing.balanceDue),
            tenantName,
            tenantEmail,
            dueDate: billing.dueDate,
            overdueDays: Math.floor(
              (now.getTime() - billing.dueDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          });

          result.escalated++;
          result.details.push({
            billingId: billing.id,
            billNumber: billing.billNumber,
            sequence: nextSequence,
            action: 'ESCALATED',
          });
        } else {
          result.sent++;
          result.details.push({
            billingId: billing.id,
            billNumber: billing.billNumber,
            sequence: nextSequence,
            action: 'SENT',
          });
        }
      } catch (error) {
        result.failed++;
        result.details.push({
          billingId: billing.id,
          billNumber: billing.billNumber,
          sequence: nextSequence,
          action: 'FAILED',
          reason: (error as Error).message,
        });

        this.logger.error(
          `Failed to send reminder #${nextSequence} for ${billing.billNumber}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Reminder run complete for partner ${partnerId}: ` +
      `processed=${result.processed}, sent=${result.sent}, skipped=${result.skipped}, ` +
      `failed=${result.failed}, escalated=${result.escalated}`,
    );

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Escalate to Legal
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Manually escalate a billing to legal action.
   * Creates a sequence-4 legal notice reminder if not already sent.
   */
  async escalateToLegal(billingId: string): Promise<SendReminderResult> {
    const partnerId = this.PartnerContext.partnerId;

    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: billingId },
      include: {
        reminders: {
          where: { sequence: 4 },
          take: 1,
        },
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    if (billing.reminders.length > 0) {
      throw new BadRequestException(
        `Legal notice already sent for billing ${billing.billNumber}`,
      );
    }

    // Force sequence 4 (legal notice)
    return this.sendReminder(billingId, 4);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // List Reminders
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all reminders for a billing, ordered by sequence.
   */
  async listReminders(billingId: string): Promise<ReminderView[]> {
    const billing = await this.prisma.rentBilling.findFirst({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${billingId} not found`);
    }

    const reminders = await this.prisma.rentBillingReminder.findMany({
      where: { billingId },
      orderBy: { sequence: 'asc' },
    });

    return reminders.map((r) => ({
      id: r.id,
      billingId: r.billingId,
      sequence: r.sequence,
      type: r.type,
      status: r.status,
      sentAt: r.sentAt,
      sentTo: r.sentTo,
      response: r.response,
      respondedAt: r.respondedAt,
      escalatedAt: r.escalatedAt,
      escalatedTo: r.escalatedTo,
      createdAt: r.createdAt,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event Listener (called by BillingProcessor via EventEmitter)
  // ─────────────────────────────────────────────────────────────────────────

  @OnEvent('billing.reminders.process')
  async handleProcessRemindersEvent(payload: { partnerId: string }): Promise<void> {
    try {
      const result = await this.scheduleReminders(payload.partnerId);
      this.logger.log(
        `Reminder event processed for partner ${payload.partnerId}: ` +
        `sent=${result.sent}, skipped=${result.skipped}, escalated=${result.escalated}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process reminders for partner ${payload.partnerId}: ${(error as Error).message}`,
      );
    }
  }
}
