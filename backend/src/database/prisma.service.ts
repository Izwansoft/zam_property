import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service - Database client
 * TODO: Implement full Prisma service in Session 1.x
 */
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }
}
