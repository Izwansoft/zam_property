import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { QueueModule } from '@infrastructure/queue';
import { RedisModule } from '@infrastructure/redis';
import { PartnerContextModule } from '@core/partner-context';

import { VendorModule } from '@modules/vendor';
import { ListingModule } from '@modules/listing';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    QueueModule,
    RedisModule,
    VendorModule,
    ListingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
