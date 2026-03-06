import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { RentPaymentService } from './payment.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RentPaymentWebhookSucceededEvent {
  partnerId: string;
  gatewayId: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

interface RentPaymentWebhookFailedEvent {
  partnerId: string;
  gatewayId: string;
  amount: number;
  currency: string;
  error?: string;
  metadata: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listener
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RentPaymentWebhookListener {
  private readonly logger = new Logger(RentPaymentWebhookListener.name);

  constructor(private readonly paymentService: RentPaymentService) {}

  @OnEvent('rent.payment.webhook.succeeded')
  async handlePaymentSucceeded(event: RentPaymentWebhookSucceededEvent): Promise<void> {
    this.logger.log(
      `Handling rent payment webhook succeeded: gatewayId=${event.gatewayId}`,
    );

    try {
      await this.paymentService.handlePaymentSuccess(
        event.gatewayId,
        event.amount,
        event.metadata,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process rent payment success for ${event.gatewayId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  @OnEvent('rent.payment.webhook.failed')
  async handlePaymentFailed(event: RentPaymentWebhookFailedEvent): Promise<void> {
    this.logger.log(
      `Handling rent payment webhook failed: gatewayId=${event.gatewayId}`,
    );

    try {
      await this.paymentService.handlePaymentFailure(
        event.gatewayId,
        event.error,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process rent payment failure for ${event.gatewayId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
