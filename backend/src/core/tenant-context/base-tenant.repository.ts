import { ForbiddenException, Injectable, Scope } from '@nestjs/common';

import { PrismaService } from '@infrastructure/database';

import { TenantContextService } from './tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseTenantRepository {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly tenantContext: TenantContextService,
  ) {}

  protected get tenantId(): string {
    return this.tenantContext.tenantId;
  }

  protected scopeWhere<T extends Record<string, unknown> | undefined>(
    where: T,
  ): T extends undefined ? { tenantId: string } : T & { tenantId: string } {
    return {
      ...(where ?? {}),
      tenantId: this.tenantId,
    } as T extends undefined ? { tenantId: string } : T & { tenantId: string };
  }

  protected scopeCreateData<T extends Record<string, unknown>>(data: T): T & { tenantId: string } {
    if (
      'tenantId' in data &&
      typeof data.tenantId === 'string' &&
      data.tenantId.length > 0 &&
      data.tenantId !== this.tenantId
    ) {
      throw new ForbiddenException('Cross-tenant write is forbidden');
    }

    return { ...data, tenantId: this.tenantId };
  }

  protected assertTenantId(tenantId: string): void {
    if (tenantId !== this.tenantId) {
      throw new ForbiddenException('Cross-tenant access is forbidden');
    }
  }
}
