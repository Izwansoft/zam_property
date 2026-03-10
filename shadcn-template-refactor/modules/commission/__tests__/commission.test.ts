/**
 * Unit Tests — Commission Module
 *
 * Tests commission types, utilities, query keys, status config,
 * and type config.
 *
 * @see modules/commission/types/index.ts
 * @see modules/commission/hooks/useCommissions.ts
 */

import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query";
import { PORTAL_NAV_CONFIG } from "@/config/navigation";
import { roleToPortal, Role } from "@/modules/auth/types";
import {
  type Commission,
  type CommissionDetail,
  type CommissionFilters,
  type CommissionSummary,
  type CommissionType,
  type CommissionStatus,
  COMMISSION_STATUS_CONFIG,
  COMMISSION_TYPE_CONFIG,
  DEFAULT_COMMISSION_FILTERS,
  cleanCommissionFilters,
  formatCommissionAmount,
  getCommissionTypeLabel,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_COMMISSION: Commission = {
  id: "comm-001",
  agentId: "agent-001",
  tenancyId: "tenancy-001",
  type: "BOOKING",
  rate: 1.0,
  amount: 2500,
  status: "PENDING",
  paidAt: null,
  paidRef: null,
  notes: "First booking commission",
  createdAt: "2026-02-15T00:00:00Z",
  updatedAt: "2026-02-15T00:00:00Z",
  tenancy: {
    id: "tenancy-001",
    listing: {
      id: "listing-001",
      title: "Bangsar South Condo",
      slug: "bangsar-south-condo",
    },
  },
};

const MOCK_COMMISSION_PAID: Commission = {
  ...MOCK_COMMISSION,
  id: "comm-002",
  type: "RENEWAL",
  rate: 0.5,
  amount: 1250,
  status: "PAID",
  paidAt: "2026-03-01T00:00:00Z",
  paidRef: "PAY-REF-001",
};

const MOCK_SUMMARY: CommissionSummary = {
  totalCommissions: 8,
  totalAmount: 4250,
  pendingCount: 2,
  pendingAmount: 1200,
  approvedCount: 1,
  approvedAmount: 850,
  paidCount: 5,
  paidAmount: 2200,
};

// ---------------------------------------------------------------------------
// Commission Status Config
// ---------------------------------------------------------------------------

describe("Commission Status Config", () => {
  it("should have all 4 statuses", () => {
    expect(Object.keys(COMMISSION_STATUS_CONFIG)).toHaveLength(4);
    expect(COMMISSION_STATUS_CONFIG).toHaveProperty("PENDING");
    expect(COMMISSION_STATUS_CONFIG).toHaveProperty("APPROVED");
    expect(COMMISSION_STATUS_CONFIG).toHaveProperty("PAID");
    expect(COMMISSION_STATUS_CONFIG).toHaveProperty("CANCELLED");
  });

  it("PENDING should have outline variant", () => {
    expect(COMMISSION_STATUS_CONFIG.PENDING.label).toBe("Pending");
    expect(COMMISSION_STATUS_CONFIG.PENDING.variant).toBe("outline");
  });

  it("APPROVED should have default variant", () => {
    expect(COMMISSION_STATUS_CONFIG.APPROVED.label).toBe("Approved");
    expect(COMMISSION_STATUS_CONFIG.APPROVED.variant).toBe("default");
  });

  it("PAID should have secondary variant", () => {
    expect(COMMISSION_STATUS_CONFIG.PAID.label).toBe("Paid");
    expect(COMMISSION_STATUS_CONFIG.PAID.variant).toBe("secondary");
  });

  it("CANCELLED should have destructive variant", () => {
    expect(COMMISSION_STATUS_CONFIG.CANCELLED.label).toBe("Cancelled");
    expect(COMMISSION_STATUS_CONFIG.CANCELLED.variant).toBe("destructive");
  });
});

// ---------------------------------------------------------------------------
// Commission Type Config
// ---------------------------------------------------------------------------

describe("Commission Type Config", () => {
  it("should have BOOKING and RENEWAL types", () => {
    expect(Object.keys(COMMISSION_TYPE_CONFIG)).toHaveLength(2);
    expect(COMMISSION_TYPE_CONFIG).toHaveProperty("BOOKING");
    expect(COMMISSION_TYPE_CONFIG).toHaveProperty("RENEWAL");
  });

  it("BOOKING should have correct label and description", () => {
    expect(COMMISSION_TYPE_CONFIG.BOOKING.label).toBe("Booking");
    expect(COMMISSION_TYPE_CONFIG.BOOKING.description).toContain("new tenancy");
  });

  it("RENEWAL should have correct label and description", () => {
    expect(COMMISSION_TYPE_CONFIG.RENEWAL.label).toBe("Renewal");
    expect(COMMISSION_TYPE_CONFIG.RENEWAL.description).toContain("renewal");
  });
});

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

describe("cleanCommissionFilters", () => {
  it("removes empty and undefined values", () => {
    const cleaned = cleanCommissionFilters({
      status: "PENDING",
      type: undefined,
      page: 1,
      agentId: "",
    });
    expect(cleaned).toEqual({ status: "PENDING", page: 1 });
  });

  it("keeps all non-empty values", () => {
    const cleaned = cleanCommissionFilters({
      status: "APPROVED",
      type: "BOOKING",
      page: 2,
      limit: 10,
      sortBy: "amount",
      sortDir: "asc",
    });
    expect(cleaned).toEqual({
      status: "APPROVED",
      type: "BOOKING",
      page: 2,
      limit: 10,
      sortBy: "amount",
      sortDir: "asc",
    });
  });
});

describe("formatCommissionAmount", () => {
  it("formats amount with RM prefix and 2 decimal places", () => {
    const result = formatCommissionAmount(2500);
    expect(result).toContain("RM");
    expect(result).toContain("2,500.00");
  });

  it("formats zero amount correctly", () => {
    const result = formatCommissionAmount(0);
    expect(result).toContain("RM");
    expect(result).toContain("0.00");
  });

  it("formats large amounts with thousand separator", () => {
    const result = formatCommissionAmount(125000.5);
    expect(result).toContain("RM");
    expect(result).toContain("125,000.50");
  });
});

describe("getCommissionTypeLabel", () => {
  it("returns 'Booking' for BOOKING type", () => {
    expect(getCommissionTypeLabel("BOOKING")).toBe("Booking");
  });

  it("returns 'Renewal' for RENEWAL type", () => {
    expect(getCommissionTypeLabel("RENEWAL")).toBe("Renewal");
  });
});

// ---------------------------------------------------------------------------
// Default Filters
// ---------------------------------------------------------------------------

describe("DEFAULT_COMMISSION_FILTERS", () => {
  it("has correct default values", () => {
    expect(DEFAULT_COMMISSION_FILTERS).toEqual({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDir: "desc",
    });
  });
});

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

describe("Commission Query Keys", () => {
  const partnerId = "partner-001";

  it("commissions.all returns correct key", () => {
    expect(queryKeys.commissions.all(partnerId)).toEqual([
      "partner",
      "partner-001",
      "commissions",
    ]);
  });

  it("commissions.list returns correct key with params", () => {
    const params = { status: "PENDING", page: 1 };
    expect(queryKeys.commissions.list(partnerId, params)).toEqual([
      "partner",
      "partner-001",
      "commissions",
      "list",
      params,
    ]);
  });

  it("commissions.detail returns correct key", () => {
    expect(queryKeys.commissions.detail(partnerId, "comm-001")).toEqual([
      "partner",
      "partner-001",
      "commissions",
      "detail",
      "comm-001",
    ]);
  });

  it("commissions.agentCommissions returns correct key", () => {
    const params = { page: 1 };
    expect(
      queryKeys.commissions.agentCommissions(partnerId, "agent-001", params)
    ).toEqual([
      "partner",
      "partner-001",
      "commissions",
      "agent",
      "agent-001",
      params,
    ]);
  });

  it("commissions.agentSummary returns correct key", () => {
    expect(
      queryKeys.commissions.agentSummary(partnerId, "agent-001")
    ).toEqual([
      "partner",
      "partner-001",
      "commissions",
      "summary",
      "agent-001",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Type Validation
// ---------------------------------------------------------------------------

describe("Commission Type Contracts", () => {
  it("Commission interface has all required fields", () => {
    const commission: Commission = MOCK_COMMISSION;
    expect(commission.id).toBeDefined();
    expect(commission.agentId).toBeDefined();
    expect(commission.tenancyId).toBeDefined();
    expect(commission.type).toBeDefined();
    expect(commission.rate).toBeDefined();
    expect(commission.amount).toBeDefined();
    expect(commission.status).toBeDefined();
    expect(commission.createdAt).toBeDefined();
    expect(commission.updatedAt).toBeDefined();
  });

  it("CommissionDetail extends Commission with required relations", () => {
    const detail: CommissionDetail = {
      ...MOCK_COMMISSION,
      agent: {
        id: "agent-001",
        companyId: "company-001",
        userId: "user-001",
        renNumber: "REN 12345",
        renExpiry: "2027-12-31T00:00:00Z",
        totalListings: 5,
        totalDeals: 3,
        totalRevenue: 45000,
        referralCode: "REF-ABC123",
        referredBy: null,
        status: "ACTIVE",
        verticalType: null,
        createdAt: "2026-01-15T00:00:00Z",
        updatedAt: "2026-02-20T00:00:00Z",
      },
      tenancy: {
        id: "tenancy-001",
        listing: {
          id: "listing-001",
          title: "Bangsar South Condo",
          slug: "bangsar-south-condo",
        },
      },
    };
    expect(detail.agent).toBeDefined();
    expect(detail.agent.id).toBe("agent-001");
    expect(detail.tenancy.id).toBe("tenancy-001");
  });

  it("CommissionSummary has all required fields", () => {
    const summary: CommissionSummary = MOCK_SUMMARY;
    expect(summary.totalCommissions).toBe(8);
    expect(summary.totalAmount).toBe(4250);
    expect(summary.pendingCount).toBe(2);
    expect(summary.pendingAmount).toBe(1200);
    expect(summary.approvedCount).toBe(1);
    expect(summary.approvedAmount).toBe(850);
    expect(summary.paidCount).toBe(5);
    expect(summary.paidAmount).toBe(2200);
  });

  it("CommissionFilters has correct shape", () => {
    const filters: CommissionFilters = {
      agentId: "agent-001",
      tenancyId: "tenancy-001",
      type: "BOOKING",
      status: "PENDING",
      page: 1,
      limit: 20,
      sortBy: "amount",
      sortDir: "desc",
    };
    expect(filters.type).toBe("BOOKING");
    expect(filters.sortBy).toBe("amount");
  });

  it("Paid commission has paidAt and paidRef", () => {
    expect(MOCK_COMMISSION_PAID.status).toBe("PAID");
    expect(MOCK_COMMISSION_PAID.paidAt).toBeDefined();
    expect(MOCK_COMMISSION_PAID.paidRef).toBe("PAY-REF-001");
  });
});

// ---------------------------------------------------------------------------
// Navigation — Agent Portal
// ---------------------------------------------------------------------------

describe("Agent Portal Navigation", () => {
  it("should have agent portal in PORTAL_NAV_CONFIG", () => {
    expect(PORTAL_NAV_CONFIG).toHaveProperty("agent");
  });

  it("should have Dashboard item in Overview group", () => {
    const agentConfig = PORTAL_NAV_CONFIG.agent;
    const overviewGroup = agentConfig.navGroups.find(
      (g: any) => g.title === "Overview"
    );
    expect(overviewGroup).toBeDefined();
    const dashboardItem = overviewGroup?.items.find(
      (i: any) => i.title === "Dashboard"
    );
    expect(dashboardItem).toBeDefined();
    expect(dashboardItem?.href).toBe("/dashboard/agent");
  });

  it("should have Commissions item in Earnings group", () => {
    const agentConfig = PORTAL_NAV_CONFIG.agent;
    const earningsGroup = agentConfig.navGroups.find(
      (g: any) => g.title === "Earnings"
    );
    expect(earningsGroup).toBeDefined();
    const commissionsItem = earningsGroup?.items.find(
      (i: any) => i.title === "Commissions"
    );
    expect(commissionsItem).toBeDefined();
    expect(commissionsItem?.href).toBe("/dashboard/agent/commissions");
  });

  it("should have My Listings item in Work group", () => {
    const agentConfig = PORTAL_NAV_CONFIG.agent;
    const workGroup = agentConfig.navGroups.find(
      (g: any) => g.title === "Work"
    );
    expect(workGroup).toBeDefined();
    const listingsItem = workGroup?.items.find(
      (i: any) => i.title === "My Listings"
    );
    expect(listingsItem).toBeDefined();
    expect(listingsItem?.href).toBe("/dashboard/agent/listings");
  });

  it("should have Referrals item in Account group", () => {
    const agentConfig = PORTAL_NAV_CONFIG.agent;
    const accountGroup = agentConfig.navGroups.find(
      (g: any) => g.title === "Account"
    );
    expect(accountGroup).toBeDefined();
    const referralsItem = accountGroup?.items.find(
      (i: any) => i.title === "Referrals"
    );
    expect(referralsItem).toBeDefined();
    expect(referralsItem?.href).toBe("/dashboard/agent/referrals");
  });

  it("should have 4 navigation groups", () => {
    const agentConfig = PORTAL_NAV_CONFIG.agent;
    expect(agentConfig.navGroups).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Auth — Agent Portal Mapping
// ---------------------------------------------------------------------------

describe("Agent Auth Mapping", () => {
  it("Role.AGENT should map to agent portal", () => {
    expect(roleToPortal(Role.AGENT)).toBe("agent");
  });
});
