/**
 * Unit Tests — Admin PM (Platform Admin Property Management)
 *
 * Tests navigation config, query keys, types, and module structure
 * for Session 8.7: Platform Admin PM.
 *
 * @see modules/admin/types/admin-pm.ts
 * @see modules/admin/hooks/admin-pm.ts
 * @see modules/admin/components/pm-stats-dashboard.tsx
 * @see config/navigation.ts
 */

import { describe, it, expect } from "vitest";
import {
  PORTAL_NAV_CONFIG,
  detectPortal,
  getPortalNavConfig,
} from "@/config/navigation";
import { queryKeys } from "@/lib/query";
import type {
  AdminPMStats,
  StatusCountDto,
  TenancyStatsDto,
  BillingStatsDto,
  MaintenanceStatsDto,
  PayoutStatsDto,
  DepositStatsDto,
  InspectionStatsDto,
  ClaimStatsDto,
  LegalStatsDto,
  TenantStatsDto,
  CompanyAgentStatsDto,
  AdminTenancyFilters,
  AdminBillingFilters,
  AdminPayoutFilters,
  BulkApprovePayoutVariables,
  BulkProcessBillsVariables,
} from "../types/admin-pm";
import {
  DEFAULT_ADMIN_TENANCY_FILTERS,
  DEFAULT_ADMIN_BILLING_FILTERS,
  DEFAULT_ADMIN_PAYOUT_FILTERS,
  cleanAdminPMFilters,
} from "../types/admin-pm";

// ---------------------------------------------------------------------------
// Platform Navigation — Governance & Billing boundaries
// ---------------------------------------------------------------------------

describe("Platform Navigation — Governance boundaries", () => {
  const platformConfig = PORTAL_NAV_CONFIG.platform;

  it("should have ecosystem and finance groups", () => {
    const groupTitles = platformConfig.navGroups.map((g) => g.title);
    expect(groupTitles).toContain("Ecosystem");
    expect(groupTitles).toContain("Finance");
  });

  it("should expose global ecosystem indexes", () => {
    const ecosystemGroup = platformConfig.navGroups.find(
      (g) => g.title === "Ecosystem"
    );
    expect(ecosystemGroup).toBeDefined();
    expect(ecosystemGroup?.items.find((i) => i.title === "Vendors")?.href).toBe(
      "/dashboard/platform/vendors",
    );
    expect(ecosystemGroup?.items.find((i) => i.title === "Companies")?.href).toBe(
      "/dashboard/platform/companies",
    );
    expect(ecosystemGroup?.items.find((i) => i.title === "Agents")?.href).toBe(
      "/dashboard/platform/agents",
    );
  });

  it("should have Partner Billing in Finance group", () => {
    const financeGroup = platformConfig.navGroups.find(
      (g) => g.title === "Finance"
    );
    const billing = financeGroup?.items.find((i) => i.title === "Partner Billing");
    expect(billing).toBeDefined();
    expect(billing?.href).toBe("/dashboard/platform/billing");
  });

  it("should not expose partner operational payouts in platform nav", () => {
    const financeGroup = platformConfig.navGroups.find(
      (g) => g.title === "Finance"
    );
    const payouts = financeGroup?.items.find((i) => i.title === "Payouts");
    expect(payouts).toBeUndefined();
  });

  it("Finance group should include only governance billing entries", () => {
    const financeGroup = platformConfig.navGroups.find(
      (g) => g.title === "Finance"
    );
    expect(financeGroup?.items).toHaveLength(3);
  });

  it("Finance group should appear before Governance", () => {
    const groupTitles = platformConfig.navGroups.map((g) => g.title);
    const financeIndex = groupTitles.indexOf("Finance");
    const governanceIndex = groupTitles.indexOf("Governance");
    expect(financeIndex).toBeGreaterThan(-1);
    expect(financeIndex).toBeLessThan(governanceIndex);
  });

  it("all Finance items should have icons", () => {
    const financeGroup = platformConfig.navGroups.find(
      (g) => g.title === "Finance"
    );
    for (const item of financeGroup?.items ?? []) {
      expect(item.icon).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// detectPortal — platform PM routes
// ---------------------------------------------------------------------------

describe("detectPortal — platform PM routes", () => {
  it("detects /dashboard/platform/billing as platform", () => {
    expect(detectPortal("/dashboard/platform/billing")).toBe("platform");
  });

  it("detects /dashboard/platform/partners as platform", () => {
    expect(detectPortal("/dashboard/platform/partners")).toBe("platform");
  });
});

// ---------------------------------------------------------------------------
// Query Keys — adminPM
// ---------------------------------------------------------------------------

describe("Query Keys — adminPM", () => {
  it("should have adminPM namespace", () => {
    expect(queryKeys.adminPM).toBeDefined();
    expect(queryKeys.adminPM.all).toEqual(["admin-pm"]);
  });

  it("stats key includes 'stats'", () => {
    const key = queryKeys.adminPM.stats();
    expect(key).toEqual(["admin-pm", "stats"]);
  });

  it("tenancies key includes params", () => {
    const params = { page: 1, status: "ACTIVE" };
    const key = queryKeys.adminPM.tenancies(params);
    expect(key).toEqual(["admin-pm", "tenancies", params]);
  });

  it("bills key includes params", () => {
    const params = { page: 2, status: "OVERDUE" };
    const key = queryKeys.adminPM.bills(params);
    expect(key).toEqual(["admin-pm", "bills", params]);
  });

  it("payouts key includes params", () => {
    const params = { status: "PENDING" };
    const key = queryKeys.adminPM.payouts(params);
    expect(key).toEqual(["admin-pm", "payouts", params]);
  });

  it("maintenance key includes params", () => {
    const params = { page: 1 };
    const key = queryKeys.adminPM.maintenance(params);
    expect(key).toEqual(["admin-pm", "maintenance", params]);
  });

  it("claims key includes params", () => {
    const key = queryKeys.adminPM.claims();
    expect(key).toEqual(["admin-pm", "claims", undefined]);
  });

  it("companies key includes params", () => {
    const key = queryKeys.adminPM.companies({ search: "test" });
    expect(key).toEqual(["admin-pm", "companies", { search: "test" }]);
  });
});

// ---------------------------------------------------------------------------
// Admin PM Types
// ---------------------------------------------------------------------------

describe("AdminPMStats type", () => {
  it("should accept valid stats object", () => {
    const stats: AdminPMStats = {
      tenancy: {
        byStatus: [
          { status: "ACTIVE", count: 50 },
          { status: "TERMINATED", count: 10 },
        ],
        activeCount: 50,
        expiringSoonCount: 5,
        totalCount: 60,
      },
      billing: {
        byStatus: [{ status: "PAID", count: 100 }],
        overdueCount: 3,
        overdueAmount: "15600.00",
        collectedThisMonth: "250000.00",
        billedThisMonth: "280000.00",
      },
      maintenance: {
        byStatus: [{ status: "OPEN", count: 12 }],
        byPriority: [{ status: "HIGH", count: 4 }],
        openCount: 12,
        unassignedCount: 3,
      },
      payout: {
        byStatus: [{ status: "COMPLETED", count: 45 }],
        pendingApprovalAmount: "85000.00",
        processedThisMonth: "120000.00",
      },
      deposit: {
        byStatus: [{ status: "HELD", count: 50 }],
        totalHeldAmount: "150000.00",
        pendingRefundCount: 5,
      },
      inspection: {
        byStatus: [{ status: "SCHEDULED", count: 8 }],
        upcomingCount: 8,
        completedThisMonth: 15,
      },
      claim: {
        byStatus: [{ status: "PENDING_REVIEW", count: 6 }],
        pendingReviewCount: 6,
        disputedCount: 2,
      },
      legal: {
        byStatus: [{ status: "OPEN", count: 3 }],
        openCount: 3,
      },
      tenant: {
        totalCount: 75,
        activeCount: 60,
      },
      companyAgent: {
        totalCompanies: 10,
        activeCompanies: 8,
        totalAgents: 25,
        activeAgents: 20,
      },
      generatedAt: "2026-02-26T12:00:00.000Z",
    };

    expect(stats.tenancy.activeCount).toBe(50);
    expect(stats.billing.overdueAmount).toBe("15600.00");
    expect(stats.payout.pendingApprovalAmount).toBe("85000.00");
    expect(stats.companyAgent.totalCompanies).toBe(10);
    expect(stats.generatedAt).toBeDefined();
  });

  it("StatusCountDto should have status and count", () => {
    const item: StatusCountDto = { status: "ACTIVE", count: 42 };
    expect(item.status).toBe("ACTIVE");
    expect(item.count).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Default Filters
// ---------------------------------------------------------------------------

describe("Default Admin PM Filters", () => {
  it("DEFAULT_ADMIN_TENANCY_FILTERS has correct defaults", () => {
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.page).toBe(1);
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.pageSize).toBe(20);
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.status).toBe("");
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.search).toBe("");
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.sortBy).toBe("updatedAt");
    expect(DEFAULT_ADMIN_TENANCY_FILTERS.sortOrder).toBe("desc");
  });

  it("DEFAULT_ADMIN_BILLING_FILTERS has correct defaults", () => {
    expect(DEFAULT_ADMIN_BILLING_FILTERS.page).toBe(1);
    expect(DEFAULT_ADMIN_BILLING_FILTERS.pageSize).toBe(20);
    expect(DEFAULT_ADMIN_BILLING_FILTERS.status).toBe("");
    expect(DEFAULT_ADMIN_BILLING_FILTERS.search).toBe("");
    expect(DEFAULT_ADMIN_BILLING_FILTERS.sortBy).toBe("updatedAt");
    expect(DEFAULT_ADMIN_BILLING_FILTERS.sortOrder).toBe("desc");
  });

  it("DEFAULT_ADMIN_PAYOUT_FILTERS has correct defaults", () => {
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.page).toBe(1);
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.pageSize).toBe(20);
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.status).toBe("");
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.search).toBe("");
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.sortBy).toBe("updatedAt");
    expect(DEFAULT_ADMIN_PAYOUT_FILTERS.sortOrder).toBe("desc");
  });
});

// ---------------------------------------------------------------------------
// cleanAdminPMFilters
// ---------------------------------------------------------------------------

describe("cleanAdminPMFilters", () => {
  it("removes empty string values", () => {
    const result = cleanAdminPMFilters({
      page: 1,
      status: "",
      search: "",
      partnerId: "abc",
    });
    expect(result).toEqual({ page: 1, partnerId: "abc" });
  });

  it("removes null and undefined values", () => {
    const result = cleanAdminPMFilters({
      page: 2,
      status: null,
      search: undefined,
    });
    expect(result).toEqual({ page: 2 });
  });

  it("preserves non-empty values", () => {
    const result = cleanAdminPMFilters({
      page: 1,
      pageSize: 20,
      status: "ACTIVE",
      search: "test",
    });
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      status: "ACTIVE",
      search: "test",
    });
  });

  it("preserves falsy non-empty values (0, false)", () => {
    const result = cleanAdminPMFilters({
      page: 0,
      featured: false,
    });
    expect(result).toEqual({ page: 0, featured: false });
  });
});

// ---------------------------------------------------------------------------
// Bulk Action Types
// ---------------------------------------------------------------------------

describe("Bulk Action Types", () => {
  it("BulkApprovePayoutVariables requires payoutIds", () => {
    const vars: BulkApprovePayoutVariables = {
      payoutIds: ["payout-1", "payout-2"],
    };
    expect(vars.payoutIds).toHaveLength(2);
  });

  it("BulkProcessBillsVariables requires billingIds and action", () => {
    const vars: BulkProcessBillsVariables = {
      billingIds: ["bill-1", "bill-2"],
      action: "send",
    };
    expect(vars.billingIds).toHaveLength(2);
    expect(vars.action).toBe("send");
  });

  it("BulkProcessBillsVariables accepts write-off action", () => {
    const vars: BulkProcessBillsVariables = {
      billingIds: ["bill-1"],
      action: "write-off",
    };
    expect(vars.action).toBe("write-off");
  });
});

// ---------------------------------------------------------------------------
// Module Barrel Exports
// ---------------------------------------------------------------------------

describe("Admin Module Barrel Exports", () => {
  it("should export PM types from types/admin-pm", async () => {
    const mod = await import("../types/admin-pm");
    expect(mod.DEFAULT_ADMIN_TENANCY_FILTERS).toBeDefined();
    expect(mod.DEFAULT_ADMIN_BILLING_FILTERS).toBeDefined();
    expect(mod.DEFAULT_ADMIN_PAYOUT_FILTERS).toBeDefined();
    expect(mod.cleanAdminPMFilters).toBeDefined();
  });

  it("should export PM hooks from hooks/admin-pm", async () => {
    const mod = await import("../hooks/admin-pm");
    expect(mod.useAdminPMStats).toBeDefined();
    expect(mod.useAdminTenancies).toBeDefined();
    expect(mod.useAdminBills).toBeDefined();
    expect(mod.useAdminPayouts).toBeDefined();
    expect(mod.useBulkApprovePayout).toBeDefined();
    expect(mod.useBulkProcessBills).toBeDefined();
  });

  it("should still export listing types from types/index", async () => {
    const mod = await import("../types/index");
    expect(mod.DEFAULT_ADMIN_LISTING_FILTERS).toBeDefined();
    expect(mod.cleanAdminFilters).toBeDefined();
    expect(mod.ADMIN_LISTING_ACTIONS).toBeDefined();
    expect(mod.BULK_ACTIONS).toBeDefined();
  });

  it("should still export listing hooks from hooks/admin-listings", async () => {
    const mod = await import("../hooks/admin-listings");
    expect(mod.useAdminListings).toBeDefined();
    expect(mod.useAdminListingDetail).toBeDefined();
    expect(mod.useAdminPublishListing).toBeDefined();
  });
});
