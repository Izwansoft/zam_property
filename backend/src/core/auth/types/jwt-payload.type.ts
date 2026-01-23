import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: Role;
  tokenType?: 'access' | 'refresh';
  permissions?: string[];
}
