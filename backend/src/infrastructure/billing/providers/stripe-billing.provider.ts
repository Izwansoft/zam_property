import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { TypedConfigService } from '@config/typed-config.service';
import {
  BillingProvider,
  BillingCustomer,
  BillingSubscription,
  BillingPaymentIntent,
  BillingPaymentMethod,
  BillingInvoice,
  CreateCustomerParams,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  CreatePaymentIntentParams,
  AttachPaymentMethodParams,
} from '../interfaces/billing-provider.interface';

@Injectable()
export class StripeBillingProvider implements BillingProvider {
  private readonly logger = new Logger(StripeBillingProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  readonly providerName = 'stripe';

  constructor(private readonly config: TypedConfigService) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    this.logger.log('Stripe billing provider initialized');
  }

  async createCustomer(params: CreateCustomerParams): Promise<BillingCustomer> {
    this.logger.debug(`Creating Stripe customer for email: ${params.email}`);

    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata || {},
    });

    return this.mapCustomer(customer);
  }

  async getCustomer(customerId: string): Promise<BillingCustomer> {
    const customer = await this.stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      throw new Error(`Customer ${customerId} has been deleted`);
    }

    return this.mapCustomer(customer as Stripe.Customer);
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<BillingSubscription> {
    this.logger.debug(`Creating Stripe subscription for customer: ${params.customerId}`);

    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata || {},
      trial_period_days: params.trialPeriodDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return this.mapSubscription(subscription);
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<BillingSubscription> {
    this.logger.debug(`Updating Stripe subscription: ${params.subscriptionId}`);

    const updateData: Stripe.SubscriptionUpdateParams = {
      metadata: params.metadata,
    };

    if (params.priceId) {
      // Get current subscription to update items
      const currentSub = await this.stripe.subscriptions.retrieve(params.subscriptionId);
      updateData.items = [
        {
          id: currentSub.items.data[0].id,
          price: params.priceId,
        },
      ];
    }

    const subscription = await this.stripe.subscriptions.update(params.subscriptionId, updateData);

    return this.mapSubscription(subscription);
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately = false,
  ): Promise<BillingSubscription> {
    this.logger.debug(`Canceling Stripe subscription: ${subscriptionId}`);

    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediately,
    });

    if (immediately) {
      await this.stripe.subscriptions.cancel(subscriptionId);
    }

    return this.mapSubscription(subscription);
  }

  async getSubscription(subscriptionId: string): Promise<BillingSubscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    return this.mapSubscription(subscription);
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<BillingPaymentIntent> {
    this.logger.debug(`Creating payment intent for amount: ${params.amount}`);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return this.mapPaymentIntent(paymentIntent);
  }

  async attachPaymentMethod(params: AttachPaymentMethodParams): Promise<BillingPaymentMethod> {
    this.logger.debug(`Attaching payment method ${params.paymentMethodId} to ${params.customerId}`);

    const paymentMethod = await this.stripe.paymentMethods.attach(params.paymentMethodId, {
      customer: params.customerId,
    });

    // Set as default payment method
    await this.stripe.customers.update(params.customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    });

    return this.mapPaymentMethod(paymentMethod);
  }

  async getInvoices(customerId: string): Promise<BillingInvoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    return invoices.data.map((invoice) => this.mapInvoice(invoice));
  }

  async getInvoice(invoiceId: string): Promise<BillingInvoice> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    return this.mapInvoice(invoice);
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: string | Buffer): Stripe.Event {
    // In production, this should be called after verification
    return JSON.parse(payload.toString());
  }

  // Mapping helpers
  private mapCustomer(customer: Stripe.Customer): BillingCustomer {
    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || '',
      metadata: customer.metadata,
    };
  }

  private mapSubscription(subscription: Stripe.Subscription): BillingSubscription {
    const sub = subscription as unknown as {
      id: string;
      customer: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      canceled_at?: number;
      metadata: Record<string, string>;
    };
    return {
      id: sub.id,
      customerId: sub.customer,
      status: sub.status as BillingSubscription['status'],
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
      metadata: sub.metadata,
    };
  }

  private mapPaymentIntent(paymentIntent: Stripe.PaymentIntent): BillingPaymentIntent {
    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  }

  private mapPaymentMethod(paymentMethod: Stripe.PaymentMethod): BillingPaymentMethod {
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expiryMonth: paymentMethod.card?.exp_month,
      expiryYear: paymentMethod.card?.exp_year,
    };
  }

  private mapInvoice(invoice: Stripe.Invoice): BillingInvoice {
    return {
      id: invoice.id,
      customerId: invoice.customer as string,
      subscriptionId: (invoice as unknown as { subscription?: string }).subscription,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status as 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : undefined,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    };
  }
}
