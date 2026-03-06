import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { PaymentEventRepository } from '../repositories/payment-event.repository';
import { PrismaService } from '@infrastructure/database/prisma.service';

/**
 * Stripe Webhook Service
 * Processes Stripe webhook events idempotently.
 * Emits domain events but does NOT call domain services directly.
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly paymentEventRepo: PaymentEventRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    // Check if already processed (idempotency)
    const alreadyProcessed = await this.paymentEventRepo.isProcessed(event.id);

    if (alreadyProcessed) {
      this.logger.debug(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Extract partner ID from metadata
    const partnerId = this.extractpartnerId(event);

    if (!partnerId) {
      this.logger.warn(`Event ${event.id} has no partner ID, skipping`);
      return;
    }

    // Store event
    const eventData = event.data.object as { object?: string; id: string };
    await this.paymentEventRepo.create(
      partnerId,
      event.id,
      'stripe',
      event.type,
      eventData.object || 'unknown',
      eventData.id,
      event,
    );

    try {
      // Route to specific handler
      await this.routeEvent(event, partnerId);

      // Mark as processed
      await this.paymentEventRepo.markProcessed(event.id);

      this.logger.log(`Successfully processed webhook event ${event.id}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process webhook ${event.id}: ${err.message}`, err.stack);

      // Record error
      await this.paymentEventRepo.recordError(event.id, err.message);

      throw error;
    }
  }

  private async routeEvent(event: Stripe.Event, partnerId: string): Promise<void> {
    switch (event.type) {
      // Payment intents
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, partnerId);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, partnerId);
        break;

      // Invoice events
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice, partnerId);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, partnerId);
        break;

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription, partnerId);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, partnerId);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    partnerId: string,
  ): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id} for partner ${partnerId}`);

    const metadata = paymentIntent.metadata || {};

    // Route to rent payment handler if paymentType is 'rent'
    if (metadata.paymentType === 'rent') {
      this.eventEmitter.emit('rent.payment.webhook.succeeded', {
        partnerId,
        gatewayId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata,
      });
      return;
    }

    // Default: platform/subscription payment
    this.eventEmitter.emit('billing.payment.succeeded', {
      partnerId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer,
    });
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    partnerId: string,
  ): Promise<void> {
    this.logger.warn(`Payment failed: ${paymentIntent.id} for partner ${partnerId}`);

    const metadata = paymentIntent.metadata || {};

    // Route to rent payment handler if paymentType is 'rent'
    if (metadata.paymentType === 'rent') {
      this.eventEmitter.emit('rent.payment.webhook.failed', {
        partnerId,
        gatewayId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        error: paymentIntent.last_payment_error?.message,
        metadata,
      });
      return;
    }

    // Default: platform/subscription payment
    this.eventEmitter.emit('billing.payment.failed', {
      partnerId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice, partnerId: string): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id} for partner ${partnerId}`);

    // Update invoice record in database
    await this.prisma.invoice.updateMany({
      where: {
        partnerId,
        externalId: invoice.id,
      },
      data: {
        status: 'PAID',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      },
    });

    const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;

    // Emit domain event
    this.eventEmitter.emit('billing.invoice.paid', {
      partnerId,
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
    });

    // If related to subscription, update subscription status
    if (subscriptionId) {
      this.eventEmitter.emit('billing.subscription.payment_succeeded', {
        partnerId,
        subscriptionId,
      });
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
    partnerId: string,
  ): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id} for partner ${partnerId}`);

    const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;

    // Emit domain event
    this.eventEmitter.emit('billing.invoice.payment_failed', {
      partnerId,
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
    });

    // If related to subscription, may need to update subscription to PAST_DUE
    if (subscriptionId) {
      this.eventEmitter.emit('billing.subscription.payment_failed', {
        partnerId,
        subscriptionId,
      });
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    partnerId: string,
  ): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id} for partner ${partnerId}`);

    const sub = subscription as unknown as {
      current_period_start: number;
      current_period_end: number;
    };

    // Sync subscription status to domain
    this.eventEmitter.emit('billing.subscription.updated', {
      partnerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    partnerId: string,
  ): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id} for partner ${partnerId}`);

    this.eventEmitter.emit('billing.subscription.deleted', {
      partnerId,
      subscriptionId: subscription.id,
    });
  }

  private extractpartnerId(event: Stripe.Event): string | null {
    const obj = event.data.object as {
      metadata?: Record<string, string>;
      customer?: { metadata?: Record<string, string> };
    };

    // Try to extract from metadata
    if (obj.metadata?.partnerId) {
      return obj.metadata.partnerId;
    }

    // For subscriptions, check customer metadata
    if (obj.customer && typeof obj.customer === 'object' && obj.customer.metadata?.partnerId) {
      return obj.customer.metadata.partnerId;
    }

    return null;
  }
}
