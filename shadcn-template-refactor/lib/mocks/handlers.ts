// =============================================================================
// MSW Handlers — Root handler array (re-exports all domain handlers)
// =============================================================================

import { accountHandlers } from "./handlers/account";
import { analyticsHandlers } from "./handlers/analytics";
import { auditHandlers } from "./handlers/audit";
import { authHandlers } from "./handlers/auth";
import { billingHandlers } from "./handlers/billings";
import { contractHandlers } from "./handlers/contracts";
import { depositHandlers } from "./handlers/deposits";
import { interactionHandlers } from "./handlers/interactions";
import { listingHandlers } from "./handlers/listings";
import { mediaHandlers } from "./handlers/media";
import { notificationHandlers } from "./handlers/notifications";
import { tenantHandlers } from "./handlers/tenants";
import { reviewHandlers } from "./handlers/reviews";
import { tenancyHandlers } from "./handlers/tenancies";
import { PartnerAdminHandlers } from "./handlers/partners";
import { searchHandlers } from "./handlers/search";
import { subscriptionHandlers } from "./handlers/subscriptions";
import { featureFlagHandlers } from "./handlers/feature-flags";
import { jobHandlers } from "./handlers/jobs";
import { pricingHandlers } from "./handlers/pricing";
import { vendorHandlers } from "./handlers/vendors";
import { verticalHandlers } from "./handlers/verticals";
import { payoutHandlers } from "./handlers/payouts";
import { publicHandlers } from "./handlers/public";

export const handlers = [
  ...accountHandlers,
  ...analyticsHandlers,
  ...auditHandlers,
  ...authHandlers,
  ...billingHandlers,
  ...contractHandlers,
  ...depositHandlers,
  ...interactionHandlers,
  ...listingHandlers,
  ...mediaHandlers,
  ...notificationHandlers,
  ...tenantHandlers,
  ...reviewHandlers,
  ...searchHandlers,
  ...subscriptionHandlers,
  ...tenancyHandlers,
  ...PartnerAdminHandlers,
  ...featureFlagHandlers,
  ...jobHandlers,
  ...pricingHandlers,
  ...vendorHandlers,
  ...verticalHandlers,
  ...payoutHandlers,
  ...publicHandlers,
];
