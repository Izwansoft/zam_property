import { Module } from '@nestjs/common';
import { PartnerContextModule } from '@core/partner-context/partner-context.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionRepository } from './interaction.repository';
import { InteractionMessageRepository } from './interaction-message.repository';

@Module({
  imports: [PartnerContextModule],
  controllers: [InteractionController],
  providers: [
    InteractionService,
    InteractionRepository,
    InteractionMessageRepository,
    PrismaService,
  ],
  exports: [InteractionService, InteractionRepository, InteractionMessageRepository],
})
export class InteractionModule {}
