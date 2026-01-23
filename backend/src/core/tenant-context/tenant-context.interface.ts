export type TenantContextSource = 'header' | 'host';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  domain?: string;
  source: TenantContextSource;
  correlationId: string;
  userId?: string;
}
