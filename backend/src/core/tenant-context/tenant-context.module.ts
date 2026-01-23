import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';

import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [TenantContextService, TenantMiddleware],
  exports: [TenantContextService, TenantMiddleware],
})
export class TenantContextModule {}
