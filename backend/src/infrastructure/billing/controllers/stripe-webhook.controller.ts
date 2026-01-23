import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StripeBillingProvider } from '../providers/stripe-billing.provider';
import { StripeWebhookService } from '../services/stripe-webhook.service';

/**
 * Stripe Webhook Controller
 * Handles webhook events from Stripe for payment processing.
 * Webhooks are verified, processed idempotently, and emit domain events.
 */
@Controller('webhooks/stripe')
@ApiTags('Webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly billingProvider: StripeBillingProvider,
    private readonly webhookService: StripeWebhookService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @ApiExcludeEndpoint() // Don't expose in Swagger (webhook endpoint)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Verify webhook signature
    const isValid = this.billingProvider.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      this.logger.error('Webhook signature verification failed');
      throw new BadRequestException('Invalid signature');
    }

    // Parse event
    const event = this.billingProvider.parseWebhookEvent(rawBody);

    this.logger.log(`Received Stripe webhook: ${event.type} (${event.id})`);

    // Process webhook (idempotent)
    try {
      await this.webhookService.processWebhookEvent(event);
      return { received: true };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process webhook ${event.id}: ${err.message}`, err.stack);
      throw error;
    }
  }
}
