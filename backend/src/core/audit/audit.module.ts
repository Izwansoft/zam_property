/**
 * Audit Module
 * Session 4.4 - Audit Logging
 *
 * Module for audit logging functionality.
 */

import { Module, Global } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { TenantContextModule } from '@core/tenant-context';

import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Global()
@Module({
  imports: [DatabaseModule, TenantContextModule],
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
