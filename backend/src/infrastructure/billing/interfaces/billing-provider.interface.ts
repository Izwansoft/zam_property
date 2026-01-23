/**
 * Billing Provider Interface
 * All billing providers (Stripe, PayPal, etc.) must implement this interface.
 * This abstraction keeps billing concerns isolated from domain logic.
 */

export interface BillingCustomer {
  id: string; // Provider's customer ID
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface BillingSubscription {
  id: string; // Provider's subscription ID
  customerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  metadata?: Record<string, string>;
}

export interface BillingPaymentIntent {
  id: string; // Provider's payment intent ID
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface BillingPaymentMethod {
  id: string; // Provider's payment method ID
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface BillingInvoice {
  id: string; // Provider's invoice ID
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: Date;
  paidAt?: Date;
  invoiceUrl?: string;
  invoicePdf?: string;
}

export interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string; // Provider's price/plan ID
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface AttachPaymentMethodParams {
  paymentMethodId: string;
  customerId: string;
}

/**
 * BillingProvider Interface
 * All billing provider adapters must implement this interface.
 */
export interface BillingProvider {
  /**
   * Provider name (e.g., 'stripe', 'paypal')
   */
  readonly providerName: string;

  /**
   * Create a customer in the billing provider
   */
  createCustomer(params: CreateCustomerParams): Promise<BillingCustomer>;

  /**
   * Get customer by provider ID
   */
  getCustomer(customerId: string): Promise<BillingCustomer>;

  /**
   * Create a subscription for a customer
   */
  createSubscription(params: CreateSubscriptionParams): Promise<BillingSubscription>;

  /**
   * Update an existing subscription
   */
  updateSubscription(params: UpdateSubscriptionParams): Promise<BillingSubscription>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<BillingSubscription>;

  /**
   * Get subscription by provider ID
   */
  getSubscription(subscriptionId: string): Promise<BillingSubscription>;

  /**
   * Create a payment intent (for one-time charges)
   */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<BillingPaymentIntent>;

  /**
   * Attach payment method to customer
   */
  attachPaymentMethod(params: AttachPaymentMethodParams): Promise<BillingPaymentMethod>;

  /**
   * Get invoices for a customer
   */
  getInvoices(customerId: string): Promise<BillingInvoice[]>;

  /**
   * Get a specific invoice
   */
  getInvoice(invoiceId: string): Promise<BillingInvoice>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string | Buffer): unknown;
}
