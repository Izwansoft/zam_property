import type { PartnerContext } from '@core/partner-context';

declare global {
  namespace Express {
    interface Request {
      PartnerContext?: PartnerContext;
    }
  }
}

export {};
