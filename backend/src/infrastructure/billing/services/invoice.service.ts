import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceRepository, CreateInvoiceParams } from '../repositories/invoice.repository';
import { StripeBillingProvider } from '../providers/stripe-billing.provider';
import { Invoice } from '@prisma/client';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly invoiceRepo: InvoiceRepository,
    private readonly billingProvider: StripeBillingProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create invoice record from billing provider data
   */
  async createFromProvider(params: CreateInvoiceParams): Promise<Invoice> {
    const invoice = await this.invoiceRepo.create(params);

    this.logger.log(`Created invoice ${invoice.id} for partner ${invoice.partnerId}`);

    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      partnerId: invoice.partnerId,
      amount: invoice.amount,
      status: invoice.status,
    });

    return invoice;
  }

  /**
   * Get all invoices for a partner
   */
  async findBypartnerId(partnerId: string): Promise<Invoice[]> {
    return this.invoiceRepo.findBypartnerId(partnerId);
  }

  /**
   * Get single invoice
   */
  async findById(id: string): Promise<Invoice | null> {
    return this.invoiceRepo.findById(id);
  }

  /**
   * Sync invoice from billing provider
   */
  async syncFromProvider(externalId: string, partnerId: string): Promise<Invoice> {
    // Get invoice from provider
    const providerInvoice = await this.billingProvider.getInvoice(externalId);

    // Check if already exists
    let invoice = await this.invoiceRepo.findByExternalId(externalId);

    if (invoice) {
      // Update existing
      invoice = await this.invoiceRepo.updateStatus(
        invoice.id,
        providerInvoice.status as 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE',
        providerInvoice.paidAt,
      );
    } else {
      // Create new
      invoice = await this.createFromProvider({
        partnerId,
        externalId: providerInvoice.id,
        externalProvider: 'stripe',
        customerId: providerInvoice.customerId,
        subscriptionId: providerInvoice.subscriptionId,
        amount: providerInvoice.amount,
        currency: providerInvoice.currency,
        status: providerInvoice.status as 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE',
        dueDate: providerInvoice.dueDate,
        invoiceUrl: providerInvoice.invoiceUrl,
        invoicePdf: providerInvoice.invoicePdf,
      });
    }

    return invoice;
  }

  /**
   * Get invoices for a subscription
   */
  async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    return this.invoiceRepo.findBySubscriptionId(subscriptionId);
  }
}
