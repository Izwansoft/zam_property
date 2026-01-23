import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Database module - Provides Prisma database access
 * TODO: Implement full database module in Session 1.x
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
