import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { PartnerMiddleware, PartnerContextModule } from '@core/partner-context';
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
import { NotificationModule } from '@modules/notification/notification.module';
import { SubscriptionModule } from '@modules/subscription';
import { PricingModule } from '@modules/pricing';
import { VerticalModule } from '@modules/vertical';
import { AnalyticsModule } from '@modules/analytics';
import { AdminModule } from '@modules/admin';
import { PublicModule } from '@modules/public';
import { AccountModule } from '@modules/account';
import { TenantModule } from '@modules/tenant';
import { TenancyModule } from '@modules/tenancy';
import { ContractModule } from '@modules/contract';
import { DepositModule } from '@modules/deposit';
import { RentBillingModule } from '@modules/billing';
import { RentPaymentModule } from '@modules/payment';
import { PayoutModule } from '@modules/payout';
import { ReportModule } from '@modules/report';
import { MaintenanceModule } from '@modules/maintenance';
import { InspectionModule } from '@modules/inspection';
import { ClaimModule } from '@modules/claim';
import { CompanyModule } from '@modules/company';
import { AgentModule } from '@modules/agent';
import { PropertyMemberModule } from '@modules/property-member/property-member.module';
import { CommissionModule } from '@modules/commission';
import { AffiliateModule } from '@modules/affiliate';
import { LegalModule } from '@modules/legal';

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
    PartnerContextModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    FeatureFlagModule,
    AuditModule,
    VendorModule,
    ListingModule,
    MediaModule,
    InteractionModule,
    NotificationModule,
    AnalyticsModule,
    ReviewModule,
    SubscriptionModule,
    PricingModule,
    VerticalModule,
    RealEstateVerticalModule,
    TenantModule,
    TenancyModule,
    ContractModule,
    DepositModule,
    RentBillingModule,
    RentPaymentModule,
    PayoutModule,
    ReportModule,
    MaintenanceModule,
    InspectionModule,
    ClaimModule,
    CompanyModule,
    AgentModule,
    PropertyMemberModule,
    CommissionModule,
    AffiliateModule,
    LegalModule,
    HealthModule,
    AdminModule,
    PublicModule,
    AccountModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Request ID middleware runs first to ensure all errors include requestId
    consumer.apply(RequestIdMiddleware).forRoutes('*');

    // Partner middleware runs second, after request ID is set
    consumer
      .apply(PartnerMiddleware)
      .exclude(
        { path: 'api/docs', method: RequestMethod.ALL },
        { path: 'api/docs/(.*)', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
