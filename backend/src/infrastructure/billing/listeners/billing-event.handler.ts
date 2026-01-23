import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StripeBillingProvider } from '../providers/stripe-billing.provider';

/**
 * Billing Event Handler
 * Listens to subscription domain events and syncs with billing provider.
 * This keeps billing isolated from domain logic.
 */
@Injectable()
export class BillingEventHandler {
  private readonly logger = new Logger(BillingEventHandler.name);

  constructor(private readonly billingProvider: StripeBillingProvider) {}

  @OnEvent('subscription.created')
  async handleSubscriptionCreated(event: {
    tenantId: string;
    email?: string;
    tenantName?: string;
  }) {
    this.logger.debug(`Handling subscription.created event for tenant: ${event.tenantId}`);

    try {
      // Create customer in billing provider if needed
      const customerEmail = event.email || `tenant-${event.tenantId}@example.com`;
      const customer = await this.billingProvider.createCustomer({
        email: customerEmail,
        name: event.tenantName || `Tenant ${event.tenantId}`,
        metadata: {
          tenantId: event.tenantId,
        },
      });

      this.logger.log(`Created billing customer ${customer.id} for tenant ${event.tenantId}`);

      // Note: Actual subscription in billing provider should be created
      // when payment is processed, not automatically on domain event
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle subscription.created: ${err.message}`, err.stack);
      // Don't throw - billing failures should not crash domain operations
    }
  }

  @OnEvent('subscription.cancelled')
  async handleSubscriptionCancelled(event: {
    subscriptionId: string;
    externalId?: string;
    immediately?: boolean;
  }) {
    this.logger.debug(`Handling subscription.cancelled event: ${event.subscriptionId}`);

    try {
      if (event.externalId) {
        await this.billingProvider.cancelSubscription(event.externalId, event.immediately);
        this.logger.log(`Cancelled billing subscription ${event.externalId}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle subscription.cancelled: ${err.message}`, err.stack);
    }
  }

  @OnEvent('subscription.plan_changed')
  async handleSubscriptionPlanChanged(event: {
    subscriptionId: string;
    externalId?: string;
    newPriceId?: string;
  }) {
    this.logger.debug(`Handling subscription.plan_changed event: ${event.subscriptionId}`);

    try {
      if (event.externalId && event.newPriceId) {
        await this.billingProvider.updateSubscription({
          subscriptionId: event.externalId,
          priceId: event.newPriceId,
        });
        this.logger.log(`Updated billing subscription ${event.externalId} to new price`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle subscription.plan_changed: ${err.message}`, err.stack);
    }
  }

  @OnEvent('usage.threshold.reached')
  async handleUsageThresholdReached(event: {
    tenantId: string;
    metricKey: string;
    count: number;
    limit: number;
  }) {
    this.logger.debug(
      `Handling usage.threshold.reached event for tenant: ${event.tenantId}, metric: ${event.metricKey}`,
    );

    // This could trigger invoice generation or usage-based charges
    // For now, just log it
    this.logger.warn(
      `Tenant ${event.tenantId} reached 100% of ${event.metricKey} quota (${event.count}/${event.limit})`,
    );
  }
}
