import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PaymentEvent, Prisma } from '@prisma/client';

@Injectable()
export class PaymentEventRepository {
  private readonly logger = new Logger(PaymentEventRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if event has already been processed (idempotency)
   */
  async isProcessed(externalId: string): Promise<boolean> {
    const event = await this.prisma.paymentEvent.findUnique({
      where: { externalId },
    });

    return event?.processed || false;
  }

  /**
   * Create payment event record
   */
  async create(
    tenantId: string,
    externalId: string,
    externalProvider: string,
    eventType: string,
    resourceType: string,
    resourceId: string,
    payload: unknown,
  ): Promise<PaymentEvent> {
    return this.prisma.paymentEvent.create({
      data: {
        tenantId,
        externalId,
        externalProvider,
        eventType,
        resourceType,
        resourceId,
        payload: payload as Prisma.InputJsonValue,
        processed: false,
      },
    });
  }

  /**
   * Mark event as processed
   */
  async markProcessed(externalId: string): Promise<void> {
    await this.prisma.paymentEvent.update({
      where: { externalId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Record error for event
   */
  async recordError(externalId: string, error: string): Promise<void> {
    await this.prisma.paymentEvent.update({
      where: { externalId },
      data: {
        error,
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get unprocessed events for retry
   */
  async getUnprocessedEvents(limit = 100): Promise<PaymentEvent[]> {
    return this.prisma.paymentEvent.findMany({
      where: {
        processed: false,
        retryCount: {
          lt: 5, // Max 5 retries
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }
}
