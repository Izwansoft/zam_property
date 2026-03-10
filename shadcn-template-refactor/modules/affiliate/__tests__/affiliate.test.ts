/**
 * Unit Tests — Affiliate Module
 *
 * Tests affiliate types, utilities, query keys, navigation config,
 * and auth portal access.
 *
 * @see modules/affiliate/types/index.ts
 * @see modules/affiliate/hooks/useAffiliate.ts
 * @see config/navigation.ts
 */

import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query";
import { PORTAL_NAV_CONFIG, detectPortal } from "@/config/navigation";
import { PORTAL_ROLE_MAP, canAccessPortal } from "@/lib/auth/route-config";
import { Role } from "@/modules/auth/types";
import {
  AFFILIATE_STATUS_CONFIG,
  REFERRAL_STATUS_CONFIG,
  REFERRAL_TYPE_CONFIG,
  PAYOUT_STATUS_CONFIG,
  DEFAULT_REFERRAL_FILTERS,
  DEFAULT_PAYOUT_FILTERS,
  cleanReferralFilters,
  formatAffiliateAmount,
  getReferralTypeLabel,
  generateReferralLink,
} from "../types";
import type {
  AffiliateProfile,
  AffiliateReferral,
  AffiliatePayout,
  AffiliateEarnings,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PROFILE: AffiliateProfile = {
  id: "aff-001",
  partnerId: "partner-001",
  userId: "user-001",
  code: "AFF-ZAM-TEST",
  type: "INDIVIDUAL",
  bankName: null,
  bankAccount: null,
  bankAccountName: null,
  status: "ACTIVE",
  totalReferrals: 12,
  totalEarnings: 5600,
  unpaidEarnings: 1200,
  notes: null,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-02-20T00:00:00Z",
  user: {
    id: "user-001",
    fullName: "Ahmad Razali",
    email: "ahmad@example.com",
  },
};

const MOCK_REFERRAL: AffiliateReferral = {
  id: "ref-001",
  affiliateId: "aff-001",
  referredId: "user-ref-001",
  referralType: "OWNER_REGISTRATION",
  status: "CONFIRMED",
  commissionAmount: 500,
  commissionRate: 10,
  confirmedAt: "2026-02-01T00:00:00Z",
  paidAt: null,
  notes: null,
  createdAt: "2026-01-20T00:00:00Z",
};

const MOCK_PAYOUT: AffiliatePayout = {
  id: "pay-001",
  affiliateId: "aff-001",
  amount: 2500,
  status: "COMPLETED",
  processedAt: "2026-02-10T00:00:00Z",
  reference: "PAY-2026-001",
  notes: null,
  createdAt: "2026-02-08T00:00:00Z",
};

const MOCK_EARNINGS: AffiliateEarnings = {
  totalEarnings: 5600,
  unpaidEarnings: 1200,
  pendingReferrals: 4,
  confirmedReferrals: 8,
  paidReferrals: 6,
  byType: [
    { type: "OWNER_REGISTRATION", count: 4, totalAmount: 2000 },
    { type: "partner_BOOKING", count: 3, totalAmount: 1500 },
    { type: "AGENT_SIGNUP", count: 1, totalAmount: 2100 },
  ],
};

// ---------------------------------------------------------------------------
// Affiliate Status Config
// ---------------------------------------------------------------------------

describe("Affiliate Status Config", () => {
  it("should have all 3 statuses", () => {
    expect(Object.keys(AFFILIATE_STATUS_CONFIG)).toHaveLength(3);
    expect(AFFILIATE_STATUS_CONFIG).toHaveProperty("ACTIVE");
    expect(AFFILIATE_STATUS_CONFIG).toHaveProperty("INACTIVE");
    expect(AFFILIATE_STATUS_CONFIG).toHaveProperty("SUSPENDED");
  });

  it("ACTIVE should have default variant", () => {
    expect(AFFILIATE_STATUS_CONFIG.ACTIVE.label).toBe("Active");
    expect(AFFILIATE_STATUS_CONFIG.ACTIVE.variant).toBe("default");
  });

  it("SUSPENDED should have destructive variant", () => {
    expect(AFFILIATE_STATUS_CONFIG.SUSPENDED.label).toBe("Suspended");
    expect(AFFILIATE_STATUS_CONFIG.SUSPENDED.variant).toBe("destructive");
  });

  it("INACTIVE should have secondary variant", () => {
    expect(AFFILIATE_STATUS_CONFIG.INACTIVE.label).toBe("Inactive");
    expect(AFFILIATE_STATUS_CONFIG.INACTIVE.variant).toBe("secondary");
  });
});

// ---------------------------------------------------------------------------
// Referral Status Config
// ---------------------------------------------------------------------------

describe("Referral Status Config", () => {
  it("should have all 4 statuses", () => {
    expect(Object.keys(REFERRAL_STATUS_CONFIG)).toHaveLength(4);
    expect(REFERRAL_STATUS_CONFIG).toHaveProperty("PENDING");
    expect(REFERRAL_STATUS_CONFIG).toHaveProperty("CONFIRMED");
    expect(REFERRAL_STATUS_CONFIG).toHaveProperty("PAID");
    expect(REFERRAL_STATUS_CONFIG).toHaveProperty("CANCELLED");
  });

  it("CONFIRMED should have default variant", () => {
    expect(REFERRAL_STATUS_CONFIG.CONFIRMED.label).toBe("Confirmed");
    expect(REFERRAL_STATUS_CONFIG.CONFIRMED.variant).toBe("default");
  });

  it("CANCELLED should have destructive variant", () => {
    expect(REFERRAL_STATUS_CONFIG.CANCELLED.label).toBe("Cancelled");
    expect(REFERRAL_STATUS_CONFIG.CANCELLED.variant).toBe("destructive");
  });
});

// ---------------------------------------------------------------------------
// Referral Type Config
// ---------------------------------------------------------------------------

describe("Referral Type Config", () => {
  it("should have all 3 types", () => {
    expect(Object.keys(REFERRAL_TYPE_CONFIG)).toHaveLength(3);
    expect(REFERRAL_TYPE_CONFIG).toHaveProperty("OWNER_REGISTRATION");
    expect(REFERRAL_TYPE_CONFIG).toHaveProperty("partner_BOOKING");
    expect(REFERRAL_TYPE_CONFIG).toHaveProperty("AGENT_SIGNUP");
  });

  it("each type should have label and description", () => {
    Object.values(REFERRAL_TYPE_CONFIG).forEach((config) => {
      expect(config.label).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Payout Status Config
// ---------------------------------------------------------------------------

describe("Payout Status Config", () => {
  it("should have all 4 statuses", () => {
    expect(Object.keys(PAYOUT_STATUS_CONFIG)).toHaveLength(4);
    expect(PAYOUT_STATUS_CONFIG).toHaveProperty("PENDING");
    expect(PAYOUT_STATUS_CONFIG).toHaveProperty("PROCESSING");
    expect(PAYOUT_STATUS_CONFIG).toHaveProperty("COMPLETED");
    expect(PAYOUT_STATUS_CONFIG).toHaveProperty("FAILED");
  });

  it("COMPLETED should have default variant", () => {
    expect(PAYOUT_STATUS_CONFIG.COMPLETED.label).toBe("Completed");
    expect(PAYOUT_STATUS_CONFIG.COMPLETED.variant).toBe("default");
  });

  it("FAILED should have destructive variant", () => {
    expect(PAYOUT_STATUS_CONFIG.FAILED.label).toBe("Failed");
    expect(PAYOUT_STATUS_CONFIG.FAILED.variant).toBe("destructive");
  });
});

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

describe("cleanReferralFilters", () => {
  it("removes empty and undefined values", () => {
    const cleaned = cleanReferralFilters({
      status: "CONFIRMED",
      referralType: undefined,
      page: 1,
    });
    expect(cleaned).toEqual({ status: "CONFIRMED", page: 1 });
  });

  it("keeps all non-empty values", () => {
    const cleaned = cleanReferralFilters({
      status: "PENDING",
      referralType: "OWNER_REGISTRATION",
      page: 2,
      pageSize: 20,
    });
    expect(cleaned).toEqual({
      status: "PENDING",
      referralType: "OWNER_REGISTRATION",
      page: 2,
      pageSize: 20,
    });
  });

  it("removes undefined values", () => {
    const cleaned = cleanReferralFilters({
      status: undefined,
      page: 1,
    });
    expect(cleaned).toEqual({ page: 1 });
  });
});

describe("formatAffiliateAmount", () => {
  it("formats positive amount with RM prefix", () => {
    expect(formatAffiliateAmount(1234.56)).toBe("RM 1,234.56");
  });

  it("formats zero amount", () => {
    expect(formatAffiliateAmount(0)).toBe("RM 0.00");
  });

  it("formats whole number", () => {
    expect(formatAffiliateAmount(5000)).toBe("RM 5,000.00");
  });
});

describe("getReferralTypeLabel", () => {
  it("returns Owner Registration label", () => {
    expect(getReferralTypeLabel("OWNER_REGISTRATION")).toBe(
      "Owner Registration"
    );
  });

  it("returns Partner Booking label", () => {
    expect(getReferralTypeLabel("partner_BOOKING")).toBe("Partner Booking");
  });

  it("returns Agent Signup label", () => {
    expect(getReferralTypeLabel("AGENT_SIGNUP")).toBe("Agent Sign-up");
  });
});

describe("generateReferralLink", () => {
  it("generates correct URL with referral code", () => {
    // jsdom provides window.location.origin as "http://localhost"
    const link = generateReferralLink("AFF-ZAM-TEST");
    expect(link).toContain("/register?ref=AFF-ZAM-TEST");
  });

  it("uses the referral code parameter in the URL", () => {
    const link = generateReferralLink("CUSTOM-CODE");
    expect(link).toContain("ref=CUSTOM-CODE");
  });
});

// ---------------------------------------------------------------------------
// Default Filters
// ---------------------------------------------------------------------------

describe("DEFAULT_REFERRAL_FILTERS", () => {
  it("has correct default values", () => {
    expect(DEFAULT_REFERRAL_FILTERS).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});

describe("DEFAULT_PAYOUT_FILTERS", () => {
  it("has correct default values", () => {
    expect(DEFAULT_PAYOUT_FILTERS).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

describe("Affiliate Query Keys", () => {
  const partnerId = "partner-001";

  it("affiliates.all returns correct key", () => {
    expect(queryKeys.affiliates.all(partnerId)).toEqual([
      "partner",
      "partner-001",
      "affiliates",
    ]);
  });

  it("affiliates.profile returns correct key", () => {
    expect(queryKeys.affiliates.profile(partnerId, "aff-001")).toEqual([
      "partner",
      "partner-001",
      "affiliates",
      "profile",
      "aff-001",
    ]);
  });

  it("affiliates.referrals returns correct key with params", () => {
    const params = { status: "CONFIRMED", page: 1 };
    expect(queryKeys.affiliates.referrals(partnerId, "aff-001", params)).toEqual(
      ["partner", "partner-001", "affiliates", "referrals", "aff-001", params]
    );
  });

  it("affiliates.earnings returns correct key", () => {
    expect(queryKeys.affiliates.earnings(partnerId, "aff-001")).toEqual([
      "partner",
      "partner-001",
      "affiliates",
      "earnings",
      "aff-001",
    ]);
  });

  it("affiliates.payouts returns correct key with params", () => {
    const params = { status: "PENDING" };
    expect(queryKeys.affiliates.payouts(partnerId, "aff-001", params)).toEqual([
      "partner",
      "partner-001",
      "affiliates",
      "payouts",
      "aff-001",
      params,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Type Validation
// ---------------------------------------------------------------------------

describe("Affiliate Type Contracts", () => {
  it("AffiliateProfile has all required fields", () => {
    const profile: AffiliateProfile = MOCK_PROFILE;
    expect(profile.id).toBeDefined();
    expect(profile.partnerId).toBeDefined();
    expect(profile.userId).toBeDefined();
    expect(profile.code).toBeDefined();
    expect(profile.type).toBe("INDIVIDUAL");
    expect(profile.status).toBe("ACTIVE");
    expect(profile.totalReferrals).toBe(12);
    expect(profile.totalEarnings).toBe(5600);
    expect(profile.unpaidEarnings).toBe(1200);
    expect(profile.user?.fullName).toBe("Ahmad Razali");
  });

  it("AffiliateReferral has all required fields", () => {
    const referral: AffiliateReferral = MOCK_REFERRAL;
    expect(referral.affiliateId).toBe("aff-001");
    expect(referral.referralType).toBe("OWNER_REGISTRATION");
    expect(referral.status).toBe("CONFIRMED");
    expect(referral.commissionAmount).toBe(500);
    expect(referral.commissionRate).toBe(10);
    expect(referral.confirmedAt).toBeDefined();
    expect(referral.paidAt).toBeNull();
  });

  it("AffiliatePayout has all required fields", () => {
    const payout: AffiliatePayout = MOCK_PAYOUT;
    expect(payout.affiliateId).toBe("aff-001");
    expect(payout.amount).toBe(2500);
    expect(payout.status).toBe("COMPLETED");
    expect(payout.processedAt).toBeDefined();
    expect(payout.reference).toBe("PAY-2026-001");
    expect(payout.notes).toBeNull();
  });

  it("AffiliateEarnings has all required fields", () => {
    const earnings: AffiliateEarnings = MOCK_EARNINGS;
    expect(earnings.totalEarnings).toBe(5600);
    expect(earnings.unpaidEarnings).toBe(1200);
    expect(earnings.pendingReferrals).toBe(4);
    expect(earnings.confirmedReferrals).toBe(8);
    expect(earnings.paidReferrals).toBe(6);
    expect(earnings.byType).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe("Affiliate Navigation", () => {
  it("should have affiliate portal in PORTAL_NAV_CONFIG", () => {
    expect(PORTAL_NAV_CONFIG).toHaveProperty("affiliate");
    expect(PORTAL_NAV_CONFIG.affiliate.portal).toBe("affiliate");
    expect(PORTAL_NAV_CONFIG.affiliate.label).toBe("Affiliate Portal");
  });

  it("should have Dashboard in Overview group", () => {
    const overviewGroup = PORTAL_NAV_CONFIG.affiliate.navGroups.find(
      (g) => g.title === "Overview"
    );
    expect(overviewGroup).toBeDefined();
    const dashboardItem = overviewGroup?.items.find(
      (i) => i.title === "Dashboard"
    );
    expect(dashboardItem?.href).toBe("/dashboard/affiliate");
    expect(dashboardItem?.exactMatch).toBe(true);
  });

  it("should have Referrals in Activity group", () => {
    const activityGroup = PORTAL_NAV_CONFIG.affiliate.navGroups.find(
      (g) => g.title === "Activity"
    );
    expect(activityGroup).toBeDefined();
    const referralsItem = activityGroup?.items.find(
      (i) => i.title === "Referrals"
    );
    expect(referralsItem?.href).toBe("/dashboard/affiliate/referrals");
  });

  it("should have Payouts in Earnings group", () => {
    const earningsGroup = PORTAL_NAV_CONFIG.affiliate.navGroups.find(
      (g) => g.title === "Earnings"
    );
    expect(earningsGroup).toBeDefined();
    const payoutsItem = earningsGroup?.items.find(
      (i) => i.title === "Payouts"
    );
    expect(payoutsItem?.href).toBe("/dashboard/affiliate/payouts");
  });

  it("should have 4 navigation groups", () => {
    expect(PORTAL_NAV_CONFIG.affiliate.navGroups).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Portal Detection
// ---------------------------------------------------------------------------

describe("Affiliate Portal Detection", () => {
  it("detectPortal should recognize affiliate paths", () => {
    expect(detectPortal("/dashboard/affiliate")).toBe("affiliate");
    expect(detectPortal("/dashboard/affiliate/referrals")).toBe("affiliate");
    expect(detectPortal("/dashboard/affiliate/payouts")).toBe("affiliate");
  });

  it("PORTAL_ROLE_MAP should have affiliate entry", () => {
    expect(PORTAL_ROLE_MAP).toHaveProperty("affiliate");
    // Empty array = any authenticated user
    expect(PORTAL_ROLE_MAP.affiliate).toEqual([]);
  });

  it("canAccessPortal should allow any role for affiliate", () => {
    expect(canAccessPortal("affiliate", Role.CUSTOMER)).toBe(true);
    expect(canAccessPortal("affiliate", Role.AGENT)).toBe(true);
    expect(canAccessPortal("affiliate", Role.SUPER_ADMIN)).toBe(true);
  });
});
