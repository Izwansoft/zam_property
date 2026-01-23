/**
 * Validation Module
 * Part 7 - Attribute Engine & Validation System
 *
 * Provides validation services for attribute validation across all verticals.
 */

import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AttributeSchemaRegistry, ValidationService } from './services';

@Global()
@Module({
  imports: [EventEmitterModule],
  providers: [AttributeSchemaRegistry, ValidationService],
  exports: [AttributeSchemaRegistry, ValidationService],
})
export class ValidationModule {}
