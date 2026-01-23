import { Module } from '@nestjs/common';
import { TenantContextModule } from '@core/tenant-context/tenant-context.module';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [TenantContextModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository, PrismaService],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
