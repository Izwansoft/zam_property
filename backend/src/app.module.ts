import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { TenantMiddleware, TenantContextModule } from '@core/tenant-context';
import { AuthModule } from '@core/auth';
import { UserModule } from '@core/user';
import { FeatureFlagModule } from '@core/feature-flags';
import { AuditModule } from '@core/audit';
import { RequestIdMiddleware } from '@common/middleware';
import { VendorModule } from '@modules/vendor';
import { ListingModule } from '@modules/listing';
import { MediaModule } from '@modules/media';
import { InteractionModule } from '@modules/interaction';
import { ReviewModule } from '@modules/review';
import { SubscriptionModule } from '@modules/subscription';
import { PricingModule } from '@modules/pricing';
import { VerticalModule } from '@modules/vertical';
import { AnalyticsModule } from '@modules/analytics';
import { AdminModule } from '@modules/admin';
import { PublicModule } from '@modules/public';

import { RealEstateVerticalModule } from '@verticals/real-estate';

import { AppConfigModule } from './config';
import { DatabaseModule } from './infrastructure/database';
import { EventsModule } from './infrastructure/events';
import { RedisModule } from './infrastructure/redis';
import { QueueModule } from './infrastructure/queue';
import { CacheModule } from './infrastructure/cache';
import { SearchModule } from './infrastructure/search';
import { BillingModule } from './infrastructure/billing';
import { WebSocketModule } from './infrastructure/websocket';
import { ProcessorsModule } from './infrastructure/queue/processors';
import { HealthModule } from './health';

@Module({
  imports: [
    AppConfigModule,
    EventsModule,
    RedisModule,
    QueueModule,
    ProcessorsModule,
    CacheModule,
    SearchModule,
    BillingModule,
    WebSocketModule,
    TenantContextModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    FeatureFlagModule,
    AuditModule,
    VendorModule,
    ListingModule,
    MediaModule,
    InteractionModule,
    AnalyticsModule,
    ReviewModule,
    SubscriptionModule,
    PricingModule,
    VerticalModule,
    RealEstateVerticalModule,
    HealthModule,
    AdminModule,
    PublicModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Request ID middleware runs first to ensure all errors include requestId
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    // Tenant middleware runs second, after request ID is set
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/docs', method: RequestMethod.ALL },
        { path: 'api/docs/(.*)', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
