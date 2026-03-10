/**
 * Unit Tests — Agent Management Module
 *
 * Tests agent types, utilities, query keys, and navigation config.
 *
 * @see modules/agent/types/index.ts
 * @see modules/agent/hooks/useAgents.ts
 */

import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query";
import { PORTAL_NAV_CONFIG } from "@/config/navigation";
import {
  type Agent,
  type AgentDetail,
  type AgentFilters,
  type AgentListing,
  AGENT_STATUS_CONFIG,
  DEFAULT_AGENT_FILTERS,
  cleanAgentFilters,
  getAgentDisplayName,
  formatRenInfo,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_AGENT: Agent = {
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
  user: {
    id: "user-001",
    fullName: "Ahmad Razali",
    email: "ahmad@example.com",
    phone: "+60123456789",
  },
  company: {
    id: "company-001",
    name: "Zam Properties Sdn Bhd",
    type: "PROPERTY_COMPANY",
  },
};

const MOCK_AGENT_NO_USER: Agent = {
  ...MOCK_AGENT,
  id: "agent-002",
  user: undefined,
  renNumber: null,
  renExpiry: null,
  referralCode: null,
};

const MOCK_LISTING: AgentListing = {
  id: "al-001",
  agentId: "agent-001",
  listingId: "listing-001",
  assignedAt: "2026-02-01T00:00:00Z",
  removedAt: null,
  listing: {
    id: "listing-001",
    title: "Bangsar South Condo",
    status: "PUBLISHED",
    price: 550000,
  },
};

// ---------------------------------------------------------------------------
// Agent Status Config
// ---------------------------------------------------------------------------

describe("Agent Status Config", () => {
  it("should have all 3 statuses", () => {
    expect(Object.keys(AGENT_STATUS_CONFIG)).toHaveLength(3);
    expect(AGENT_STATUS_CONFIG).toHaveProperty("ACTIVE");
    expect(AGENT_STATUS_CONFIG).toHaveProperty("INACTIVE");
    expect(AGENT_STATUS_CONFIG).toHaveProperty("SUSPENDED");
  });

  it("ACTIVE should have default variant", () => {
    expect(AGENT_STATUS_CONFIG.ACTIVE.label).toBe("Active");
    expect(AGENT_STATUS_CONFIG.ACTIVE.variant).toBe("default");
  });

  it("SUSPENDED should have destructive variant", () => {
    expect(AGENT_STATUS_CONFIG.SUSPENDED.label).toBe("Suspended");
    expect(AGENT_STATUS_CONFIG.SUSPENDED.variant).toBe("destructive");
  });

  it("INACTIVE should have secondary variant", () => {
    expect(AGENT_STATUS_CONFIG.INACTIVE.label).toBe("Inactive");
    expect(AGENT_STATUS_CONFIG.INACTIVE.variant).toBe("secondary");
  });
});

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

describe("cleanAgentFilters", () => {
  it("removes empty and undefined values", () => {
    const cleaned = cleanAgentFilters({
      status: "ACTIVE",
      search: "",
      page: 1,
      companyId: undefined,
      sortBy: null,
    });
    expect(cleaned).toEqual({ status: "ACTIVE", page: 1 });
  });

  it("keeps all non-empty values", () => {
    const cleaned = cleanAgentFilters({
      status: "ACTIVE",
      search: "ahmad",
      page: 2,
      limit: 20,
    });
    expect(cleaned).toEqual({
      status: "ACTIVE",
      search: "ahmad",
      page: 2,
      limit: 20,
    });
  });
});

describe("getAgentDisplayName", () => {
  it("returns user fullName when available", () => {
    expect(getAgentDisplayName(MOCK_AGENT)).toBe("Ahmad Razali");
  });

  it("returns fallback when user is undefined", () => {
    expect(getAgentDisplayName(MOCK_AGENT_NO_USER)).toBe("Agent agent-00");
  });
});

describe("formatRenInfo", () => {
  it("returns formatted REN with expiry", () => {
    const result = formatRenInfo(MOCK_AGENT);
    expect(result).toContain("REN 12345");
    expect(result).toContain("Exp:");
  });

  it("returns null when no renNumber", () => {
    expect(formatRenInfo(MOCK_AGENT_NO_USER)).toBeNull();
  });

  it("returns just REN number when no expiry", () => {
    const agentNoExpiry: Agent = {
      ...MOCK_AGENT,
      renExpiry: null,
    };
    expect(formatRenInfo(agentNoExpiry)).toBe("REN 12345");
  });
});

// ---------------------------------------------------------------------------
// Default Filters
// ---------------------------------------------------------------------------

describe("DEFAULT_AGENT_FILTERS", () => {
  it("has correct default values", () => {
    expect(DEFAULT_AGENT_FILTERS).toEqual({
      page: 1,
      limit: 20,
      status: "",
      search: "",
      sortBy: "createdAt",
      sortDir: "desc",
    });
  });
});

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

describe("Agent Query Keys", () => {
  const partnerId = "partner-001";

  it("agents.all returns correct key", () => {
    expect(queryKeys.agents.all(partnerId)).toEqual([
      "partner",
      "partner-001",
      "agents",
    ]);
  });

  it("agents.list returns correct key with params", () => {
    const params = { status: "ACTIVE", page: 1 };
    expect(queryKeys.agents.list(partnerId, params)).toEqual([
      "partner",
      "partner-001",
      "agents",
      "list",
      params,
    ]);
  });

  it("agents.detail returns correct key", () => {
    expect(queryKeys.agents.detail(partnerId, "agent-001")).toEqual([
      "partner",
      "partner-001",
      "agents",
      "detail",
      "agent-001",
    ]);
  });

  it("agents.listings returns correct key", () => {
    expect(queryKeys.agents.listings(partnerId, "agent-001")).toEqual([
      "partner",
      "partner-001",
      "agents",
      "listings",
      "agent-001",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Type Validation
// ---------------------------------------------------------------------------

describe("Agent Type Contracts", () => {
  it("Agent interface has all required fields", () => {
    const agent: Agent = MOCK_AGENT;
    expect(agent.id).toBeDefined();
    expect(agent.companyId).toBeDefined();
    expect(agent.userId).toBeDefined();
    expect(agent.status).toBeDefined();
    expect(agent.totalListings).toBeDefined();
    expect(agent.totalDeals).toBeDefined();
    expect(agent.totalRevenue).toBeDefined();
    expect(agent.createdAt).toBeDefined();
    expect(agent.updatedAt).toBeDefined();
  });

  it("AgentDetail extends Agent with required relations", () => {
    const detail: AgentDetail = {
      ...MOCK_AGENT,
      company: MOCK_AGENT.company!,
      user: MOCK_AGENT.user!,
      agentListings: [MOCK_LISTING],
    };
    expect(detail.company?.name).toBe("Zam Properties Sdn Bhd");
    expect(detail.user.fullName).toBe("Ahmad Razali");
    expect(detail.agentListings).toHaveLength(1);
  });

  it("AgentListing has required fields", () => {
    expect(MOCK_LISTING.agentId).toBe("agent-001");
    expect(MOCK_LISTING.listingId).toBe("listing-001");
    expect(MOCK_LISTING.assignedAt).toBeDefined();
    expect(MOCK_LISTING.removedAt).toBeNull();
    expect(MOCK_LISTING.listing?.title).toBe("Bangsar South Condo");
  });

  it("AgentFilters has correct shape", () => {
    const filters: AgentFilters = {
      page: 1,
      limit: 20,
      companyId: "company-001",
      status: "ACTIVE",
      search: "test",
      sortBy: "totalListings",
      sortDir: "desc",
    };
    expect(filters.companyId).toBe("company-001");
    expect(filters.sortBy).toBe("totalListings");
  });
});

// ---------------------------------------------------------------------------
// Navigation — Agents nav item
// ---------------------------------------------------------------------------

describe("Agent Navigation", () => {
  it("should have Agents item in company nav Management group", () => {
    const companyConfig = PORTAL_NAV_CONFIG.company;
    const managementGroup = companyConfig.navGroups.find(
      (g: any) => g.title === "Management"
    );
    const agentsItem = managementGroup?.items.find(
      (i: any) => i.title === "Agents"
    );
    expect(agentsItem).toBeDefined();
    expect(agentsItem?.href).toBe("/dashboard/company/agents");
  });

  it("Agents nav item should be in correct position", () => {
    const managementGroup = PORTAL_NAV_CONFIG.company.navGroups.find(
      (g: any) => g.title === "Management"
    );
    const itemTitles = managementGroup?.items.map((i: any) => i.title);
    expect(itemTitles?.[0]).toBe("Agents");
  });
});
