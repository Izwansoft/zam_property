import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { AccountController } from './account.controller';
import { AccountRepository } from './account.repository';
import { AccountService } from './account.service';

/**
 * Self-service account module for authenticated users.
 *
 * Features:
 *  - Change password
 *  - Delete account (soft)
 *  - Saved / favourited listings (CRUD)
 *  - Account settings (language, timezone, privacy)
 */
@Module({
  imports: [DatabaseModule, PartnerContextModule],
  controllers: [AccountController],
  providers: [AccountRepository, AccountService],
  exports: [AccountService],
})
export class AccountModule {}
