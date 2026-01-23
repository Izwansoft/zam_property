import type { TenantContext } from '@core/tenant-context';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

export {};
