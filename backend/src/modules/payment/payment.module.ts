import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { BillingModule } from '@infrastructure/billing';

import { RentPaymentService } from './payment.service';
import { RentPaymentController } from './payment.controller';
import { RentPaymentWebhookListener } from './payment.listeners';
import { ReconciliationService } from './reconciliation';

/**
 * Module for managing rent payments
 *
 * Features:
 * - Create payment intents (Stripe card + FPX for Malaysia)
 * - Record manual/offline payments (bank transfer, cash)
 * - Handle webhook-driven payment completion
 * - Auto-update billing status on payment
 * - Generate payment receipt PDFs
 * - FPX bank list for Malaysian payments
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    BillingModule, // For StripeBillingProvider
    EventEmitterModule.forRoot(),
  ],
  controllers: [RentPaymentController],
  providers: [RentPaymentService, RentPaymentWebhookListener, ReconciliationService],
  exports: [RentPaymentService, ReconciliationService],
})
export class RentPaymentModule {}
