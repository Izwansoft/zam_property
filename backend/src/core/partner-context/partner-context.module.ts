import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';

import { PartnerContextService } from './partner-context.service';
import { PartnerMiddleware } from './partner.middleware';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [PartnerContextService, PartnerMiddleware],
  exports: [PartnerContextService, PartnerMiddleware],
})
export class PartnerContextModule {}
