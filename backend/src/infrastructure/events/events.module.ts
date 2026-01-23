import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { EventLogService } from './services/event-log.service';
import { SearchIndexEventHandler } from './handlers/search-index.handler';
import { DatabaseModule } from '../database/database.module';

/**
 * Events module providing domain event infrastructure.
 * Uses NestJS EventEmitter2 for in-process event handling.
 *
 * This module is global so EventBusService is available throughout the app.
 *
 * Per Part 28:
 * - Events are facts (past tense)
 * - Event handlers are idempotent
 * - Events drive: notifications, search indexing, analytics, billing
 */
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for pattern matching (e.g., "listing.*")
      wildcard: true,
      // Delimiter for event namespacing
      delimiter: '.',
      // Use new listener for async events
      newListener: false,
      // Remove listener for cleanup
      removeListener: false,
      // Max listeners per event (increase for high-traffic events)
      maxListeners: 20,
      // Verbose memory leak warning
      verboseMemoryLeak: true,
      // Ignore errors in event handlers (log instead of throw)
      ignoreErrors: false,
    }),
    DatabaseModule,
  ],
  providers: [EventBusService, EventLogService, SearchIndexEventHandler],
  exports: [EventBusService, EventLogService],
})
export class EventsModule {}
