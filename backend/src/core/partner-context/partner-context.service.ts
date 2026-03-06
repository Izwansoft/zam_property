import { Inject, Injectable, InternalServerErrorException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

import type { PartnerContext } from './partner-context.interface';

@Injectable({ scope: Scope.REQUEST })
export class PartnerContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getContext(): PartnerContext {
    const context = this.request.PartnerContext;
    if (!context) {
      throw new InternalServerErrorException('PartnerContext not initialized');
    }
    return context;
  }

  get partnerId(): string {
    return this.getContext().partnerId;
  }

  get partnerSlug(): string {
    return this.getContext().partnerSlug;
  }

  get correlationId(): string {
    return this.getContext().correlationId;
  }

  get userId(): string | undefined {
    return this.getContext().userId;
  }
}
