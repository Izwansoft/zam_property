import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from '../../infrastructure/database';
import { VerticalMaintenanceInterceptor } from './vertical-maintenance.interceptor';

/**
 * Maintenance Interceptor Module
 *
 * Provides the global VerticalMaintenanceInterceptor.
 * Must be imported AFTER DatabaseModule in AppModule.
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: VerticalMaintenanceInterceptor,
    },
  ],
})
export class MaintenanceInterceptorModule {}
