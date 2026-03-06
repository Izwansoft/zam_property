import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { StorageModule } from '@infrastructure/storage';
import { PartnerContextModule } from '@core/partner-context';

import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractTemplateService } from './contract-template.service';
import { SignatureService } from './signature.service';
import { MockSignatureProvider, SIGNATURE_PROVIDER } from './providers';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [ContractController],
  providers: [
    ContractService,
    ContractTemplateService,
    SignatureService,
    // Use mock signature provider for MVP
    // Replace with DocuSignProvider or SignNowProvider for production
    {
      provide: SIGNATURE_PROVIDER,
      useClass: MockSignatureProvider,
    },
    MockSignatureProvider,
  ],
  exports: [ContractService, ContractTemplateService, SignatureService],
})
export class ContractModule {}
