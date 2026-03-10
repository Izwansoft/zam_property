/**
 * Public API Module
 * Session 4.3 - Public API & Rate Limiting
 *
 * Module for public (unauthenticated) endpoints.
 */

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { CacheModule } from '@infrastructure/cache';
import { SearchModule } from '@infrastructure/search/search.module';

import { VerticalModule } from '../vertical/vertical.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [DatabaseModule, CacheModule, SearchModule, VerticalModule],
  controllers: [PublicController],
  providers: [PublicService, RateLimitGuard],
  exports: [PublicService],
})
export class PublicModule {}
