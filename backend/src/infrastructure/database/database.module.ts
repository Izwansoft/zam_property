import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Database module providing PrismaService.
 * Uses the global 'database' config registered in AppConfigModule (config/database.config.ts).
 * No need for ConfigModule.forFeature — the config is already globally available.
 *
 * @Global() makes PrismaService available everywhere without explicit imports.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
