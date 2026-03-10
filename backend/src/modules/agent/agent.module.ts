import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

/**
 * AgentModule
 * Session 8.2 - Agent Module
 *
 * Features:
 * - Register agents in companies
 * - Agent profile management (REN number, etc.)
 * - Assign/unassign agents to listings
 * - Referral code generation
 * - Suspend/reactivate agents
 * - Performance stats tracking
 */
@Module({
  imports: [DatabaseModule, PartnerContextModule, EventEmitterModule.forRoot()],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
