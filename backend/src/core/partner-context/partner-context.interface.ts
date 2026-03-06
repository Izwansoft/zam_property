export type PartnerContextSource = 'header' | 'host';

export interface PartnerContext {
  partnerId: string;
  partnerSlug: string;
  domain?: string;
  source: PartnerContextSource;
  correlationId: string;
  userId?: string;
}
