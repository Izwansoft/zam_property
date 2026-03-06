import { ForbiddenException, Injectable, Scope } from '@nestjs/common';

import { PrismaService } from '@infrastructure/database';

import { PartnerContextService } from './partner-context.service';

@Injectable({ scope: Scope.REQUEST })
export abstract class BasePartnerRepository {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly PartnerContext: PartnerContextService,
  ) {}

  protected get partnerId(): string {
    return this.PartnerContext.partnerId;
  }

  protected scopeWhere<T extends Record<string, unknown> | undefined>(
    where: T,
  ): T extends undefined ? { partnerId: string } : T & { partnerId: string } {
    return {
      ...(where ?? {}),
      partnerId: this.partnerId,
    } as T extends undefined ? { partnerId: string } : T & { partnerId: string };
  }

  protected scopeCreateData<T extends Record<string, unknown>>(data: T): T & { partnerId: string } {
    if (
      'partnerId' in data &&
      typeof data.partnerId === 'string' &&
      data.partnerId.length > 0 &&
      data.partnerId !== this.partnerId
    ) {
      throw new ForbiddenException('Cross-partner write is forbidden');
    }

    return { ...data, partnerId: this.partnerId };
  }

  protected assertpartnerId(partnerId: string): void {
    if (partnerId !== this.partnerId) {
      throw new ForbiddenException('Cross-partner access is forbidden');
    }
  }
}
