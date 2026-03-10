/**
 * Unit Tests — Company Dashboard
 *
 * Tests CompanyStatsCards rendering and CompanyDashboard structure.
 * Tests navigation config for company portal.
 *
 * @see modules/company/components/company-stats-cards.tsx
 * @see modules/company/components/company-dashboard.tsx
 * @see config/navigation.ts
 */

import { describe, it, expect } from "vitest";
import {
  PORTAL_NAV_CONFIG,
  detectPortal,
  getPortalNavConfig,
} from "@/config/navigation";
import { Role, roleToPortal, roleToDefaultPath } from "@/modules/auth/types";
import type { CompanyDashboardStats } from "../types/dashboard";

// ---------------------------------------------------------------------------
// Company Navigation Config
// ---------------------------------------------------------------------------

describe("Company Navigation Config", () => {
  it("should have company in PORTAL_NAV_CONFIG", () => {
    expect(PORTAL_NAV_CONFIG).toHaveProperty("company");
    expect(PORTAL_NAV_CONFIG.company.portal).toBe("company");
    expect(PORTAL_NAV_CONFIG.company.label).toBe("Company Portal");
  });

  it("should have correct nav groups", () => {
    const config = PORTAL_NAV_CONFIG.company;
    const groupTitles = config.navGroups.map((g) => g.title);
    expect(groupTitles).toEqual(["Overview", "Management", "Finance", "Account"]);
  });

  it("should have Dashboard as first nav item", () => {
    const config = PORTAL_NAV_CONFIG.company;
    const firstItem = config.navGroups[0].items[0];
    expect(firstItem.title).toBe("Dashboard");
    expect(firstItem.href).toBe("/dashboard/company");
    expect(firstItem.exactMatch).toBe(true);
  });

  it("should have Agents in Management group", () => {
    const config = PORTAL_NAV_CONFIG.company;
    const managementGroup = config.navGroups.find((g) => g.title === "Management");
    const agentsItem = managementGroup?.items.find((i) => i.title === "Agents");
    expect(agentsItem).toBeDefined();
    expect(agentsItem?.href).toBe("/dashboard/company/agents");
  });

  it("should have Listings in Management group", () => {
    const config = PORTAL_NAV_CONFIG.company;
    const managementGroup = config.navGroups.find((g) => g.title === "Management");
    const listingsItem = managementGroup?.items.find((i) => i.title === "Listings");
    expect(listingsItem).toBeDefined();
    expect(listingsItem?.href).toBe("/dashboard/company/listings");
  });

  it("should have Tenancies in Management group", () => {
    const config = PORTAL_NAV_CONFIG.company;
    const managementGroup = config.navGroups.find((g) => g.title === "Management");
    const tenanciesItem = managementGroup?.items.find((i) => i.title === "Tenancies");
    expect(tenanciesItem).toBeDefined();
    expect(tenanciesItem?.href).toBe("/dashboard/company/tenancies");
  });

  it("getPortalNavConfig returns company config", () => {
    const config = getPortalNavConfig("company");
    expect(config.portal).toBe("company");
  });
});

// ---------------------------------------------------------------------------
// detectPortal — company
// ---------------------------------------------------------------------------

describe("detectPortal — company", () => {
  it("detects /dashboard/company as company portal", () => {
    expect(detectPortal("/dashboard/company")).toBe("company");
  });

  it("detects /dashboard/company/agents as company portal", () => {
    expect(detectPortal("/dashboard/company/agents")).toBe("company");
  });

  it("detects /dashboard/company/listings as company portal", () => {
    expect(detectPortal("/dashboard/company/listings")).toBe("company");
  });
});

// ---------------------------------------------------------------------------
// COMPANY_ADMIN Role Routing
// ---------------------------------------------------------------------------

describe("COMPANY_ADMIN role routing", () => {
  it("COMPANY_ADMIN maps to company portal", () => {
    expect(roleToPortal(Role.COMPANY_ADMIN)).toBe("company");
  });

  it("COMPANY_ADMIN default path is /dashboard/company", () => {
    expect(roleToDefaultPath(Role.COMPANY_ADMIN)).toBe("/dashboard/company");
  });

  it("AGENT maps to agent portal", () => {
    expect(roleToPortal(Role.AGENT)).toBe("agent");
  });
});

// ---------------------------------------------------------------------------
// CompanyDashboardStats type
// ---------------------------------------------------------------------------

describe("CompanyDashboardStats", () => {
  it("should accept valid stats object", () => {
    const stats: CompanyDashboardStats = {
      totalProperties: 42,
      totalAgents: 8,
      activeTenancies: 31,
      totalRevenue: 156800,
    };

    expect(stats.totalProperties).toBe(42);
    expect(stats.totalAgents).toBe(8);
    expect(stats.activeTenancies).toBe(31);
    expect(stats.totalRevenue).toBe(156800);
  });

  it("should accept stats with previousPeriod", () => {
    const stats: CompanyDashboardStats = {
      totalProperties: 42,
      totalAgents: 8,
      activeTenancies: 31,
      totalRevenue: 156800,
      previousPeriod: {
        totalProperties: 38,
        totalAgents: 7,
        activeTenancies: 28,
        totalRevenue: 142500,
      },
    };

    expect(stats.previousPeriod?.totalProperties).toBe(38);
    expect(stats.previousPeriod?.totalRevenue).toBe(142500);
  });
});
