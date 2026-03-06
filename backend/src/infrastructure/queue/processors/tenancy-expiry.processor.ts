import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenancyStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import {
  TenancyExpiryJob,
  TenancyCheckExpiringJob,
  TenancyNotifyExpiringJob,
  TenancyAutoTerminateJob,
} from '../job-types';
import { JobResult } from '../queue.interfaces';
import { QUEUE_NAMES } from '../queue.constants';
import { QueueService } from '../queue.service';

// Domain events for tenancy notifications
export class TenancyExpiryNoticeEvent {
  constructor(
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly daysUntilExpiry: number,
    public readonly notificationType: 'first_notice' | 'reminder' | 'final_notice',
    public readonly leaseEndDate: Date,
  ) {}
}

export class TenancyAutoTerminatedEvent {
  constructor(
    public readonly tenancyId: string,
    public readonly partnerId: string,
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly reason: string,
    public readonly terminatedAt: Date,
  ) {}
}

/**
 * Tenancy expiry processor for handling tenancy lifecycle jobs.
 *
 * Job types:
 * - tenancy.check_expiring: Scheduled job to find tenancies approaching lease end
 * - tenancy.notify_expiring: Send expiry notification to tenant and owner
 * - tenancy.auto_terminate: Auto-terminate tenancy past lease end date
 */
@Processor('tenancy.expiry')
@Injectable()
export class TenancyExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(TenancyExpiryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<TenancyExpiryJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: 'tenancy.expiry',
      jobId: job.id,
      jobType: name,
      partnerId: data.partnerId,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'tenancy.check_expiring':
          result = await this.handleCheckExpiring(job as Job<TenancyCheckExpiringJob>);
          break;
        case 'tenancy.notify_expiring':
          result = await this.handleNotifyExpiring(job as Job<TenancyNotifyExpiringJob>);
          break;
        case 'tenancy.auto_terminate':
          result = await this.handleAutoTerminate(job as Job<TenancyAutoTerminateJob>);
          break;
        default:
          this.logger.warn(`Unknown job type: ${(data as TenancyExpiryJob).type}`);
          result = {
            success: false,
            message: `Unknown job type: ${(data as TenancyExpiryJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: 'tenancy.expiry',
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: 'tenancy.expiry',
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  /**
   * Check for tenancies approaching lease end date.
   * Queue notification jobs for each expiring tenancy.
   */
  private async handleCheckExpiring(
    job: Job<TenancyCheckExpiringJob>,
  ): Promise<JobResult> {
    const { partnerId, daysBeforeExpiry, batchSize = 100 } = job.data;

    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

    // Find ACTIVE tenancies expiring within the window
    const expiringTenancies = await this.prisma.tenancy.findMany({
      where: {
        partnerId,
        status: TenancyStatus.ACTIVE,
        leaseEndDate: {
          gte: new Date(), // Not already expired
          lte: targetDate, // Within notification window
        },
      },
      select: {
        id: true,
        tenantId: true,
        ownerId: true,
        leaseEndDate: true,
      },
      take: batchSize,
    });

    if (expiringTenancies.length === 0) {
      return {
        success: true,
        message: 'No expiring tenancies found',
        data: {
          success: true,
          notifiedCount: 0,
          processedAt: new Date().toISOString(),
        },
        processedAt: new Date().toISOString(),
      };
    }

    // Determine notification type based on days
    let notificationType: 'first_notice' | 'reminder' | 'final_notice';
    if (daysBeforeExpiry >= 30) {
      notificationType = 'first_notice';
    } else if (daysBeforeExpiry >= 7) {
      notificationType = 'reminder';
    } else {
      notificationType = 'final_notice';
    }

    // Queue notification jobs for each tenancy
    for (const tenancy of expiringTenancies) {
      const daysUntilExpiry = Math.ceil(
        (tenancy.leaseEndDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      await this.queueService.addJob('tenancy.expiry', 'tenancy.notify_expiring', {
        partnerId,
        type: 'tenancy.notify_expiring',
        tenancyId: tenancy.id,
        daysUntilExpiry,
        notificationType,
      });
    }

    this.logger.log(`Queued ${expiringTenancies.length} expiry notifications for partner ${partnerId}`);

    return {
      success: true,
      message: `Queued ${expiringTenancies.length} expiry notifications`,
      data: {
        success: true,
        tenancyIds: expiringTenancies.map((t) => t.id),
        notifiedCount: expiringTenancies.length,
        processedAt: new Date().toISOString(),
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Send expiry notification to tenant and owner.
   */
  private async handleNotifyExpiring(
    job: Job<TenancyNotifyExpiringJob>,
  ): Promise<JobResult> {
    const { partnerId, tenancyId, daysUntilExpiry, notificationType } = job.data;

    // Get tenancy details
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      select: {
        id: true,
        partnerId: true,
        tenantId: true,
        ownerId: true,
        leaseEndDate: true,
        status: true,
        listing: {
          select: {
            title: true,
          },
        },
        tenant: {
          select: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!tenancy) {
      return {
        success: false,
        message: `Tenancy ${tenancyId} not found`,
        processedAt: new Date().toISOString(),
      };
    }

    if (tenancy.status !== TenancyStatus.ACTIVE) {
      return {
        success: true,
        message: `Tenancy ${tenancyId} is no longer active, skipping notification`,
        processedAt: new Date().toISOString(),
      };
    }

    // Emit event for notification system to handle
    this.eventEmitter.emit(
      'tenancy.expiry.notice',
      new TenancyExpiryNoticeEvent(
        tenancyId,
        partnerId,
        tenancy.tenantId,
        tenancy.ownerId,
        daysUntilExpiry,
        notificationType,
        tenancy.leaseEndDate!,
      ),
    );

    // Queue email notifications
    const tenantEmail = tenancy.tenant?.user?.email;
    const ownerEmail = tenancy.owner?.email;

    if (tenantEmail) {
      await this.queueService.addJob(QUEUE_NAMES.NOTIFICATION_SEND, 'email.transactional', {
        partnerId,
        type: 'email.transactional',
        to: tenantEmail,
        subject: this.getEmailSubject(notificationType, daysUntilExpiry),
        template: 'tenancy-expiry-notice',
        data: {
          recipientName: tenancy.tenant?.user?.fullName || 'Tenant',
          propertyTitle: tenancy.listing?.title || 'Property',
          leaseEndDate: tenancy.leaseEndDate?.toISOString().split('T')[0],
          daysUntilExpiry,
          notificationType,
          role: 'tenant',
        },
      });
    }

    if (ownerEmail) {
      await this.queueService.addJob(QUEUE_NAMES.NOTIFICATION_SEND, 'email.transactional', {
        partnerId,
        type: 'email.transactional',
        to: ownerEmail,
        subject: this.getEmailSubject(notificationType, daysUntilExpiry),
        template: 'tenancy-expiry-notice',
        data: {
          recipientName: tenancy.owner?.name || 'Owner',
          propertyTitle: tenancy.listing?.title || 'Property',
          leaseEndDate: tenancy.leaseEndDate?.toISOString().split('T')[0],
          daysUntilExpiry,
          notificationType,
          role: 'owner',
        },
      });
    }

    this.logger.log(`Sent ${notificationType} for tenancy ${tenancyId}, ${daysUntilExpiry} days until expiry`);

    return {
      success: true,
      message: `Sent ${notificationType} for tenancy ${tenancyId}`,
      data: {
        success: true,
        tenancyId,
        notifiedCount: 1,
        processedAt: new Date().toISOString(),
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Auto-terminate tenancy past lease end date.
   */
  private async handleAutoTerminate(
    job: Job<TenancyAutoTerminateJob>,
  ): Promise<JobResult> {
    const { partnerId, tenancyId, reason = 'Lease term completed' } = job.data;

    // Get tenancy
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      select: {
        id: true,
        partnerId: true,
        tenantId: true,
        ownerId: true,
        status: true,
        leaseEndDate: true,
      },
    });

    if (!tenancy) {
      return {
        success: false,
        message: `Tenancy ${tenancyId} not found`,
        processedAt: new Date().toISOString(),
      };
    }

    if (tenancy.status !== TenancyStatus.ACTIVE) {
      return {
        success: true,
        message: `Tenancy ${tenancyId} is not active, skipping auto-terminate`,
        processedAt: new Date().toISOString(),
      };
    }

    // Check if lease has actually ended
    if (tenancy.leaseEndDate && tenancy.leaseEndDate > new Date()) {
      return {
        success: true,
        message: `Tenancy ${tenancyId} lease has not ended yet`,
        processedAt: new Date().toISOString(),
      };
    }

    // Update tenancy status to TERMINATED
    await this.prisma.$transaction([
      this.prisma.tenancy.update({
        where: { id: tenancyId },
        data: {
          status: TenancyStatus.TERMINATED,
          actualEndDate: new Date(),
        },
      }),
      this.prisma.tenancyStatusHistory.create({
        data: {
          tenancyId,
          fromStatus: TenancyStatus.ACTIVE,
          toStatus: TenancyStatus.TERMINATED,
          reason,
          changedBy: 'SYSTEM',
        },
      }),
    ]);

    // Emit event
    this.eventEmitter.emit(
      'tenancy.auto.terminated',
      new TenancyAutoTerminatedEvent(
        tenancyId,
        partnerId,
        tenancy.tenantId,
        tenancy.ownerId,
        reason,
        new Date(),
      ),
    );

    this.logger.log(`Auto-terminated tenancy ${tenancyId}: ${reason}`);

    return {
      success: true,
      message: `Auto-terminated tenancy ${tenancyId}`,
      data: {
        success: true,
        tenancyId,
        terminatedCount: 1,
        processedAt: new Date().toISOString(),
      },
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Get email subject based on notification type.
   */
  private getEmailSubject(
    notificationType: 'first_notice' | 'reminder' | 'final_notice',
    daysUntilExpiry: number,
  ): string {
    switch (notificationType) {
      case 'first_notice':
        return `Lease Expiry Notice - ${daysUntilExpiry} Days Remaining`;
      case 'reminder':
        return `Lease Expiry Reminder - ${daysUntilExpiry} Days Left`;
      case 'final_notice':
        return `URGENT: Lease Expires in ${daysUntilExpiry} Days`;
      default:
        return `Lease Expiry Notice`;
    }
  }
}
