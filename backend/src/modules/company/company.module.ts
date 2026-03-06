import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

/**
 * CompanyModule
 * Session 8.1 - Company Module
 *
 * Features:
 * - Register companies (PROPERTY_COMPANY, MANAGEMENT_COMPANY, AGENCY)
 * - Verify / suspend companies
 * - Manage company admins (ADMIN, PIC roles)
 * - Partner-scoped company management
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
