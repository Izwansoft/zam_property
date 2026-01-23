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

    // Extract tenant ID from metadata
    const tenantId = this.extractTenantId(event);

    if (!tenantId) {
      this.logger.warn(`Event ${event.id} has no tenant ID, skipping`);
      return;
    }

    // Store event
    const eventData = event.data.object as { object?: string; id: string };
    await this.paymentEventRepo.create(
      tenantId,
      event.id,
      'stripe',
      event.type,
      eventData.object || 'unknown',
      eventData.id,
      event,
    );

    try {
      // Route to specific handler
      await this.routeEvent(event, tenantId);

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

  private async routeEvent(event: Stripe.Event, tenantId: string): Promise<void> {
    switch (event.type) {
      // Payment intents
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, tenantId);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, tenantId);
        break;

      // Invoice events
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice, tenantId);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, tenantId);
        break;

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription, tenantId);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, tenantId);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id} for tenant ${tenantId}`);

    this.eventEmitter.emit('billing.payment.succeeded', {
      tenantId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer,
    });
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    tenantId: string,
  ): Promise<void> {
    this.logger.warn(`Payment failed: ${paymentIntent.id} for tenant ${tenantId}`);

    this.eventEmitter.emit('billing.payment.failed', {
      tenantId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: paymentIntent.customer,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice, tenantId: string): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id} for tenant ${tenantId}`);

    // Update invoice record in database
    await this.prisma.invoice.updateMany({
      where: {
        tenantId,
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
      tenantId,
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
    });

    // If related to subscription, update subscription status
    if (subscriptionId) {
      this.eventEmitter.emit('billing.subscription.payment_succeeded', {
        tenantId,
        subscriptionId,
      });
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
    tenantId: string,
  ): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id} for tenant ${tenantId}`);

    const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;

    // Emit domain event
    this.eventEmitter.emit('billing.invoice.payment_failed', {
      tenantId,
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
    });

    // If related to subscription, may need to update subscription to PAST_DUE
    if (subscriptionId) {
      this.eventEmitter.emit('billing.subscription.payment_failed', {
        tenantId,
        subscriptionId,
      });
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id} for tenant ${tenantId}`);

    const sub = subscription as unknown as {
      current_period_start: number;
      current_period_end: number;
    };

    // Sync subscription status to domain
    this.eventEmitter.emit('billing.subscription.updated', {
      tenantId,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id} for tenant ${tenantId}`);

    this.eventEmitter.emit('billing.subscription.deleted', {
      tenantId,
      subscriptionId: subscription.id,
    });
  }

  private extractTenantId(event: Stripe.Event): string | null {
    const obj = event.data.object as {
      metadata?: Record<string, string>;
      customer?: { metadata?: Record<string, string> };
    };

    // Try to extract from metadata
    if (obj.metadata?.tenantId) {
      return obj.metadata.tenantId;
    }

    // For subscriptions, check customer metadata
    if (obj.customer && typeof obj.customer === 'object' && obj.customer.metadata?.tenantId) {
      return obj.customer.metadata.tenantId;
    }

    return null;
  }
}
