import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import type { DatabaseConfig } from '@config/database.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const database = configService.get<DatabaseConfig>('database');
    const url = database?.url ?? configService.get<string>('DATABASE_URL');

    if (!url) {
      throw new Error('DATABASE_URL is required');
    }

    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
