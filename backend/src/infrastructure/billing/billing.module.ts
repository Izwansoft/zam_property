import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { StripeBillingProvider } from './providers/stripe-billing.provider';
import { BillingEventHandler } from './listeners/billing-event.handler';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { InvoiceService } from './services/invoice.service';
import { InvoiceRepository } from './repositories/invoice.repository';
import { PaymentEventRepository } from './repositories/payment-event.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [StripeWebhookController],
  providers: [
    // Billing Provider
    StripeBillingProvider,

    // Event Handlers
    BillingEventHandler,

    // Services
    StripeWebhookService,
    InvoiceService,

    // Repositories
    InvoiceRepository,
    PaymentEventRepository,
  ],
  exports: [StripeBillingProvider, InvoiceService],
})
export class BillingModule {}
