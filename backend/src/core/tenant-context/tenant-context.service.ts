import { Inject, Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

import type { TenantContext } from './tenant-context.interface';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getContext(): TenantContext {
    const context = this.request.tenantContext;
    if (!context) {
      throw new InternalServerErrorException('TenantContext not initialized');
    }
    return context;
  }

  get tenantId(): string {
    return this.getContext().tenantId;
  }

  get tenantSlug(): string {
    return this.getContext().tenantSlug;
  }

  get correlationId(): string {
    return this.getContext().correlationId;
  }

  get userId(): string | undefined {
    return this.getContext().userId;
  }
}
