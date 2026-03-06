import { Module } from '@nestjs/common';
import { PartnerContextModule } from '@core/partner-context/partner-context.module';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [PartnerContextModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository, PrismaService],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
