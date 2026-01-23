import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { StorageModule } from '../../infrastructure/storage';
import { TenantContextModule } from '@core/tenant-context';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  imports: [StorageModule, TenantContextModule],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, PrismaService],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
