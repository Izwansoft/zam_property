import { Module } from '@nestjs/common';
import { TenantContextModule } from '@core/tenant-context/tenant-context.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionRepository } from './interaction.repository';
import { InteractionMessageRepository } from './interaction-message.repository';

@Module({
  imports: [TenantContextModule],
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
