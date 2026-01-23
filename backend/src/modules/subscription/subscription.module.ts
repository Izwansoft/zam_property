import { Module } from '@nestjs/common';
import { TenantContextModule } from '@core/tenant-context/tenant-context.module';
import { PrismaService } from '@infrastructure/database/prisma.service';

// Repositories
import { PlanRepository } from './repositories/plan.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { UsageRepository } from './repositories/usage.repository';

// Services
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { EntitlementService } from './services/entitlement.service';
import { UsageService } from './services/usage.service';

// Controllers
import { PlanController } from './controllers/plan.controller';
import { SubscriptionController } from './controllers/subscription.controller';

@Module({
  imports: [TenantContextModule],
  providers: [
    PrismaService,
    // Repositories
    PlanRepository,
    SubscriptionRepository,
    UsageRepository,
    // Services
    PlanService,
    SubscriptionService,
    EntitlementService,
    UsageService,
  ],
  controllers: [PlanController, SubscriptionController],
  exports: [
    // Export services for use in other modules
    PlanService,
    SubscriptionService,
    EntitlementService,
    UsageService,
    // Export repositories for advanced use cases
    PlanRepository,
    SubscriptionRepository,
    UsageRepository,
  ],
})
export class SubscriptionModule {}
