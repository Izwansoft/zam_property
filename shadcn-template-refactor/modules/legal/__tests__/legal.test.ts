/**
 * Unit Tests — Legal Module
 *
 * Tests legal types, utilities, query keys, navigation config,
 * and auth portal access.
 *
 * @see modules/legal/types/index.ts
 * @see modules/legal/hooks/useLegalCases.ts
 * @see config/navigation.ts
 */

import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/query";
import { PORTAL_NAV_CONFIG, detectPortal } from "@/config/navigation";
import {
  LegalCaseStatus,
  LegalCaseReason,
  LegalDocumentType,
  NoticeType,
  LEGAL_CASE_STATUS_CONFIG,
  LEGAL_CASE_REASON_CONFIG,
  LEGAL_DOCUMENT_TYPE_CONFIG,
  NOTICE_TYPE_CONFIG,
  LEGAL_CASE_TRANSITIONS,
  LEGAL_CASE_FILTER_TABS,
  getStatusesForLegalFilter,
  cleanLegalCaseFilters,
  canTransitionCase,
  isTerminalLegalStatus,
  isCourtPhase,
  formatLegalAmount,
  getLegalStatusOrder,
} from "../types";
import type {
  LegalCase,
  PanelLawyer,
  LegalDocument,
  LegalCaseFilters,
} from "../types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_LAWYER: PanelLawyer = {
  id: "lawyer-001",
  partnerId: "partner-001",
  name: "Encik Ahmad Razak",
  firm: "ARZ & Associates",
  email: "ahmad@arz-law.my",
  phone: "+60121234567",
  specialization: ["Tenancy", "Property"],
  isActive: true,
  notes: null,
  createdAt: "2026-01-10T00:00:00Z",
  updatedAt: "2026-01-10T00:00:00Z",
};

const MOCK_DOCUMENT: LegalDocument = {
  id: "doc-001",
  caseId: "case-001",
  type: "NOTICE",
  title: "First Reminder Notice",
  fileName: "reminder-001.pdf",
  fileUrl: "https://storage.example.com/docs/reminder-001.pdf",
  generatedBy: "system",
  notes: null,
  createdAt: "2026-01-15T00:00:00Z",
};

const MOCK_LEGAL_CASE: LegalCase = {
  id: "case-001",
  partnerId: "partner-001",
  tenancyId: "tenancy-001",
  tenancy: {
    id: "tenancy-001",
    listing: {
      id: "listing-001",
      title: "Setia Alam Condo Unit 12-A",
    },
    tenant: {
      id: "occ-001",
      name: "Siti Nurhaliza",
      email: "siti@example.com",
    },
  },
  caseNumber: "LEGAL-2026-0001",
  status: LegalCaseStatus.COURT_FILED,
  reason: LegalCaseReason.NON_PAYMENT,
  description: "Rent overdue for 3 months",
  amountOwed: 4500,
  lawyerId: "lawyer-001",
  lawyer: MOCK_LAWYER,
  noticeDate: "2026-01-15T00:00:00Z",
  noticeDeadline: "2026-02-15T00:00:00Z",
  courtDate: "2026-04-01T09:00:00Z",
  judgmentDate: null,
  resolvedAt: null,
  resolution: null,
  settlementAmount: null,
  notes: "Three months overdue",
  createdAt: "2026-01-10T00:00:00Z",
  updatedAt: "2026-03-15T00:00:00Z",
  documents: [MOCK_DOCUMENT],
};

// ---------------------------------------------------------------------------
// Legal Case Status Config
// ---------------------------------------------------------------------------

describe("Legal Case Status Config", () => {
  it("should have all 8 statuses", () => {
    expect(Object.keys(LEGAL_CASE_STATUS_CONFIG)).toHaveLength(8);
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("NOTICE_SENT");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("RESPONSE_PENDING");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("MEDIATION");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("COURT_FILED");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("HEARING_SCHEDULED");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("JUDGMENT");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("ENFORCING");
    expect(LEGAL_CASE_STATUS_CONFIG).toHaveProperty("CLOSED");
  });

  it("each status should have label, variant, icon, and description", () => {
    Object.values(LEGAL_CASE_STATUS_CONFIG).forEach((config) => {
      expect(config.label).toBeDefined();
      expect(config.variant).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });

  it("NOTICE_SENT should have warning variant", () => {
    expect(LEGAL_CASE_STATUS_CONFIG.NOTICE_SENT.label).toBe("Notice Sent");
    expect(LEGAL_CASE_STATUS_CONFIG.NOTICE_SENT.variant).toBe("warning");
  });

  it("COURT_FILED should have destructive variant", () => {
    expect(LEGAL_CASE_STATUS_CONFIG.COURT_FILED.label).toBe("Court Filed");
    expect(LEGAL_CASE_STATUS_CONFIG.COURT_FILED.variant).toBe("destructive");
  });

  it("CLOSED should have success variant", () => {
    expect(LEGAL_CASE_STATUS_CONFIG.CLOSED.label).toBe("Closed");
    expect(LEGAL_CASE_STATUS_CONFIG.CLOSED.variant).toBe("success");
  });

  it("MEDIATION should have default variant", () => {
    expect(LEGAL_CASE_STATUS_CONFIG.MEDIATION.label).toBe("Mediation");
    expect(LEGAL_CASE_STATUS_CONFIG.MEDIATION.variant).toBe("default");
  });
});

// ---------------------------------------------------------------------------
// Legal Case Reason Config
// ---------------------------------------------------------------------------

describe("Legal Case Reason Config", () => {
  it("should have all 4 reasons", () => {
    expect(Object.keys(LEGAL_CASE_REASON_CONFIG)).toHaveLength(4);
    expect(LEGAL_CASE_REASON_CONFIG).toHaveProperty("NON_PAYMENT");
    expect(LEGAL_CASE_REASON_CONFIG).toHaveProperty("BREACH");
    expect(LEGAL_CASE_REASON_CONFIG).toHaveProperty("DAMAGE");
    expect(LEGAL_CASE_REASON_CONFIG).toHaveProperty("OTHER");
  });

  it("each reason should have label, icon, and description", () => {
    Object.values(LEGAL_CASE_REASON_CONFIG).forEach((config) => {
      expect(config.label).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });

  it("NON_PAYMENT should be labelled Non-Payment", () => {
    expect(LEGAL_CASE_REASON_CONFIG.NON_PAYMENT.label).toBe("Non-Payment");
  });

  it("BREACH should be labelled Breach of Contract", () => {
    expect(LEGAL_CASE_REASON_CONFIG.BREACH.label).toBe("Breach of Contract");
  });
});

// ---------------------------------------------------------------------------
// Legal Document Type Config
// ---------------------------------------------------------------------------

describe("Legal Document Type Config", () => {
  it("should have all 12 document types", () => {
    expect(Object.keys(LEGAL_DOCUMENT_TYPE_CONFIG)).toHaveLength(12);
  });

  it("each type should have label, icon, and description", () => {
    Object.values(LEGAL_DOCUMENT_TYPE_CONFIG).forEach((config) => {
      expect(config.label).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });

  it("COURT_FILING should be labelled Court Filing", () => {
    expect(LEGAL_DOCUMENT_TYPE_CONFIG.COURT_FILING.label).toBe("Court Filing");
  });

  it("TERMINATION_NOTICE should be labelled Termination Notice", () => {
    expect(LEGAL_DOCUMENT_TYPE_CONFIG.TERMINATION_NOTICE.label).toBe(
      "Termination Notice"
    );
  });
});

// ---------------------------------------------------------------------------
// Notice Type Config
// ---------------------------------------------------------------------------

describe("Notice Type Config", () => {
  it("should have all 4 notice types", () => {
    expect(Object.keys(NOTICE_TYPE_CONFIG)).toHaveLength(4);
    expect(NOTICE_TYPE_CONFIG).toHaveProperty("FIRST_REMINDER");
    expect(NOTICE_TYPE_CONFIG).toHaveProperty("SECOND_REMINDER");
    expect(NOTICE_TYPE_CONFIG).toHaveProperty("LEGAL_NOTICE");
    expect(NOTICE_TYPE_CONFIG).toHaveProperty("TERMINATION_NOTICE");
  });

  it("each type should have label and description", () => {
    Object.values(NOTICE_TYPE_CONFIG).forEach((config) => {
      expect(config.label).toBeDefined();
      expect(config.description).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------

describe("Legal Case Transitions", () => {
  it("NOTICE_SENT can go to RESPONSE_PENDING or CLOSED", () => {
    const targets = LEGAL_CASE_TRANSITIONS[LegalCaseStatus.NOTICE_SENT];
    expect(targets).toContain(LegalCaseStatus.RESPONSE_PENDING);
    expect(targets).toContain(LegalCaseStatus.CLOSED);
    expect(targets).toHaveLength(2);
  });

  it("RESPONSE_PENDING can go to MEDIATION, COURT_FILED, or CLOSED", () => {
    const targets = LEGAL_CASE_TRANSITIONS[LegalCaseStatus.RESPONSE_PENDING];
    expect(targets).toContain(LegalCaseStatus.MEDIATION);
    expect(targets).toContain(LegalCaseStatus.COURT_FILED);
    expect(targets).toContain(LegalCaseStatus.CLOSED);
    expect(targets).toHaveLength(3);
  });

  it("CLOSED has no transitions (terminal)", () => {
    expect(LEGAL_CASE_TRANSITIONS[LegalCaseStatus.CLOSED]).toHaveLength(0);
  });

  it("ENFORCING can only go to CLOSED", () => {
    const targets = LEGAL_CASE_TRANSITIONS[LegalCaseStatus.ENFORCING];
    expect(targets).toEqual([LegalCaseStatus.CLOSED]);
  });

  it("all 8 statuses have transition entries", () => {
    expect(Object.keys(LEGAL_CASE_TRANSITIONS)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// Filter Tabs
// ---------------------------------------------------------------------------

describe("Legal Case Filter Tabs", () => {
  it("should have 5 tabs", () => {
    expect(LEGAL_CASE_FILTER_TABS).toHaveLength(5);
  });

  it("first tab is All Cases with no statuses filter", () => {
    expect(LEGAL_CASE_FILTER_TABS[0].value).toBe("all");
    expect(LEGAL_CASE_FILTER_TABS[0].label).toBe("All Cases");
    expect(LEGAL_CASE_FILTER_TABS[0].statuses).toBeUndefined();
  });

  it("active tab includes NOTICE_SENT, RESPONSE_PENDING, MEDIATION", () => {
    const active = LEGAL_CASE_FILTER_TABS.find((t) => t.value === "active");
    expect(active?.statuses).toContain(LegalCaseStatus.NOTICE_SENT);
    expect(active?.statuses).toContain(LegalCaseStatus.RESPONSE_PENDING);
    expect(active?.statuses).toContain(LegalCaseStatus.MEDIATION);
    expect(active?.statuses).toHaveLength(3);
  });

  it("court tab includes COURT_FILED, HEARING_SCHEDULED, JUDGMENT", () => {
    const court = LEGAL_CASE_FILTER_TABS.find((t) => t.value === "court");
    expect(court?.statuses).toContain(LegalCaseStatus.COURT_FILED);
    expect(court?.statuses).toContain(LegalCaseStatus.HEARING_SCHEDULED);
    expect(court?.statuses).toContain(LegalCaseStatus.JUDGMENT);
    expect(court?.statuses).toHaveLength(3);
  });

  it("enforcing tab includes only ENFORCING", () => {
    const enforcing = LEGAL_CASE_FILTER_TABS.find(
      (t) => t.value === "enforcing"
    );
    expect(enforcing?.statuses).toEqual([LegalCaseStatus.ENFORCING]);
  });

  it("closed tab includes only CLOSED", () => {
    const closed = LEGAL_CASE_FILTER_TABS.find((t) => t.value === "closed");
    expect(closed?.statuses).toEqual([LegalCaseStatus.CLOSED]);
  });
});

describe("getStatusesForLegalFilter", () => {
  it("returns undefined for 'all' tab", () => {
    expect(getStatusesForLegalFilter("all")).toBeUndefined();
  });

  it("returns active statuses for 'active' tab", () => {
    const statuses = getStatusesForLegalFilter("active");
    expect(statuses).toContain(LegalCaseStatus.NOTICE_SENT);
    expect(statuses).toHaveLength(3);
  });

  it("returns undefined for unknown tab", () => {
    expect(getStatusesForLegalFilter("nonexistent")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

describe("cleanLegalCaseFilters", () => {
  it("removes empty and undefined values", () => {
    const cleaned = cleanLegalCaseFilters({
      status: LegalCaseStatus.COURT_FILED,
      reason: undefined,
      page: 1,
    });
    expect(cleaned).toEqual({
      status: "COURT_FILED",
      page: 1,
    });
  });

  it("renames pageSize to limit", () => {
    const cleaned = cleanLegalCaseFilters({
      page: 1,
      pageSize: 20,
    });
    expect(cleaned).toEqual({ page: 1, limit: 20 });
    expect(cleaned).not.toHaveProperty("pageSize");
  });

  it("keeps all non-empty values", () => {
    const cleaned = cleanLegalCaseFilters({
      status: LegalCaseStatus.MEDIATION,
      reason: LegalCaseReason.NON_PAYMENT,
      search: "overdue",
      page: 2,
      pageSize: 10,
    });
    expect(cleaned).toEqual({
      status: "MEDIATION",
      reason: "NON_PAYMENT",
      search: "overdue",
      page: 2,
      limit: 10,
    });
  });

  it("removes empty string values", () => {
    const cleaned = cleanLegalCaseFilters({
      search: "",
      page: 1,
    } as LegalCaseFilters);
    expect(cleaned).toEqual({ page: 1 });
  });
});

describe("canTransitionCase", () => {
  it("returns true for statuses with transitions", () => {
    expect(canTransitionCase(LegalCaseStatus.NOTICE_SENT)).toBe(true);
    expect(canTransitionCase(LegalCaseStatus.MEDIATION)).toBe(true);
    expect(canTransitionCase(LegalCaseStatus.ENFORCING)).toBe(true);
  });

  it("returns false for CLOSED (terminal)", () => {
    expect(canTransitionCase(LegalCaseStatus.CLOSED)).toBe(false);
  });
});

describe("isTerminalLegalStatus", () => {
  it("returns true only for CLOSED", () => {
    expect(isTerminalLegalStatus(LegalCaseStatus.CLOSED)).toBe(true);
  });

  it("returns false for non-terminal statuses", () => {
    expect(isTerminalLegalStatus(LegalCaseStatus.NOTICE_SENT)).toBe(false);
    expect(isTerminalLegalStatus(LegalCaseStatus.COURT_FILED)).toBe(false);
    expect(isTerminalLegalStatus(LegalCaseStatus.ENFORCING)).toBe(false);
  });
});

describe("isCourtPhase", () => {
  it("returns true for court-related statuses", () => {
    expect(isCourtPhase(LegalCaseStatus.COURT_FILED)).toBe(true);
    expect(isCourtPhase(LegalCaseStatus.HEARING_SCHEDULED)).toBe(true);
    expect(isCourtPhase(LegalCaseStatus.JUDGMENT)).toBe(true);
    expect(isCourtPhase(LegalCaseStatus.ENFORCING)).toBe(true);
  });

  it("returns false for pre-court statuses", () => {
    expect(isCourtPhase(LegalCaseStatus.NOTICE_SENT)).toBe(false);
    expect(isCourtPhase(LegalCaseStatus.RESPONSE_PENDING)).toBe(false);
    expect(isCourtPhase(LegalCaseStatus.MEDIATION)).toBe(false);
  });

  it("returns false for CLOSED", () => {
    expect(isCourtPhase(LegalCaseStatus.CLOSED)).toBe(false);
  });
});

describe("formatLegalAmount", () => {
  it("formats amount with MYR prefix", () => {
    const result = formatLegalAmount(1234.56);
    expect(result).toContain("1,234.56");
  });

  it("formats zero amount", () => {
    const result = formatLegalAmount(0);
    expect(result).toContain("0.00");
  });

  it("formats whole number with decimals", () => {
    const result = formatLegalAmount(5000);
    expect(result).toContain("5,000.00");
  });

  it("formats large amount correctly", () => {
    const result = formatLegalAmount(125000.5);
    expect(result).toContain("125,000.50");
  });
});

describe("getLegalStatusOrder", () => {
  it("returns all 8 statuses in correct order", () => {
    const order = getLegalStatusOrder();
    expect(order).toHaveLength(8);
    expect(order[0]).toBe(LegalCaseStatus.NOTICE_SENT);
    expect(order[1]).toBe(LegalCaseStatus.RESPONSE_PENDING);
    expect(order[2]).toBe(LegalCaseStatus.MEDIATION);
    expect(order[3]).toBe(LegalCaseStatus.COURT_FILED);
    expect(order[4]).toBe(LegalCaseStatus.HEARING_SCHEDULED);
    expect(order[5]).toBe(LegalCaseStatus.JUDGMENT);
    expect(order[6]).toBe(LegalCaseStatus.ENFORCING);
    expect(order[7]).toBe(LegalCaseStatus.CLOSED);
  });
});

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

describe("Legal Query Keys", () => {
  const partnerId = "partner-001";

  it("legalCases.all returns correct key", () => {
    expect(queryKeys.legalCases.all(partnerId)).toEqual([
      "partner",
      "partner-001",
      "legal-cases",
    ]);
  });

  it("legalCases.list returns correct key with params", () => {
    const params = { status: "COURT_FILED", page: 1 };
    expect(queryKeys.legalCases.list(partnerId, params)).toEqual([
      "partner",
      "partner-001",
      "legal-cases",
      "list",
      params,
    ]);
  });

  it("legalCases.detail returns correct key", () => {
    expect(queryKeys.legalCases.detail(partnerId, "case-001")).toEqual([
      "partner",
      "partner-001",
      "legal-cases",
      "detail",
      "case-001",
    ]);
  });

  it("legalCases.documents returns correct key", () => {
    expect(queryKeys.legalCases.documents(partnerId, "case-001")).toEqual([
      "partner",
      "partner-001",
      "legal-cases",
      "documents",
      "case-001",
    ]);
  });

  it("panelLawyers.all returns correct key", () => {
    expect(queryKeys.panelLawyers.all(partnerId)).toEqual([
      "partner",
      "partner-001",
      "panel-lawyers",
    ]);
  });

  it("panelLawyers.list returns correct key with params", () => {
    const params = { isActive: true };
    expect(queryKeys.panelLawyers.list(partnerId, params)).toEqual([
      "partner",
      "partner-001",
      "panel-lawyers",
      "list",
      params,
    ]);
  });

  it("panelLawyers.detail returns correct key", () => {
    expect(queryKeys.panelLawyers.detail(partnerId, "lawyer-001")).toEqual([
      "partner",
      "partner-001",
      "panel-lawyers",
      "detail",
      "lawyer-001",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Type Validation
// ---------------------------------------------------------------------------

describe("Legal Type Contracts", () => {
  it("LegalCase has all required fields", () => {
    const legalCase: LegalCase = MOCK_LEGAL_CASE;
    expect(legalCase.id).toBeDefined();
    expect(legalCase.partnerId).toBeDefined();
    expect(legalCase.tenancyId).toBeDefined();
    expect(legalCase.caseNumber).toBe("LEGAL-2026-0001");
    expect(legalCase.status).toBe(LegalCaseStatus.COURT_FILED);
    expect(legalCase.reason).toBe(LegalCaseReason.NON_PAYMENT);
    expect(legalCase.description).toBe("Rent overdue for 3 months");
    expect(legalCase.amountOwed).toBe(4500);
    expect(legalCase.noticeDate).toBeDefined();
    expect(legalCase.courtDate).toBeDefined();
    expect(legalCase.judgmentDate).toBeNull();
    expect(legalCase.resolvedAt).toBeNull();
  });

  it("LegalCase tenancy reference has listing and tenant", () => {
    const tenancy = MOCK_LEGAL_CASE.tenancy;
    expect(tenancy?.listing?.title).toBe("Setia Alam Condo Unit 12-A");
    expect(tenancy?.tenant?.name).toBe("Siti Nurhaliza");
    expect(tenancy?.tenant?.email).toBe("siti@example.com");
  });

  it("PanelLawyer has all required fields", () => {
    const lawyer: PanelLawyer = MOCK_LAWYER;
    expect(lawyer.id).toBeDefined();
    expect(lawyer.name).toBe("Encik Ahmad Razak");
    expect(lawyer.firm).toBe("ARZ & Associates");
    expect(lawyer.email).toContain("@");
    expect(lawyer.phone).toContain("+60");
    expect(lawyer.specialization).toContain("Tenancy");
    expect(lawyer.isActive).toBe(true);
  });

  it("LegalDocument has all required fields", () => {
    const doc: LegalDocument = MOCK_DOCUMENT;
    expect(doc.id).toBeDefined();
    expect(doc.caseId).toBe("case-001");
    expect(doc.type).toBe("NOTICE");
    expect(doc.title).toBeDefined();
    expect(doc.fileName).toContain(".pdf");
    expect(doc.fileUrl).toContain("https://");
    expect(doc.generatedBy).toBe("system");
  });

  it("LegalCase documents array is populated", () => {
    expect(MOCK_LEGAL_CASE.documents).toHaveLength(1);
    expect(MOCK_LEGAL_CASE.documents?.[0].type).toBe("NOTICE");
  });

  it("LegalCase lawyer reference is populated", () => {
    expect(MOCK_LEGAL_CASE.lawyer?.name).toBe("Encik Ahmad Razak");
    expect(MOCK_LEGAL_CASE.lawyer?.firm).toBe("ARZ & Associates");
  });
});

// ---------------------------------------------------------------------------
// Enum Values
// ---------------------------------------------------------------------------

describe("Legal Enums", () => {
  it("LegalCaseStatus has 8 values", () => {
    expect(Object.values(LegalCaseStatus)).toHaveLength(8);
  });

  it("LegalCaseReason has 4 values", () => {
    expect(Object.values(LegalCaseReason)).toHaveLength(4);
  });

  it("LegalDocumentType has 12 values", () => {
    expect(Object.values(LegalDocumentType)).toHaveLength(12);
  });

  it("NoticeType has 4 values", () => {
    expect(Object.values(NoticeType)).toHaveLength(4);
  });

  it("NoticeType values are subset of LegalDocumentType", () => {
    const docTypes = Object.values(LegalDocumentType);
    Object.values(NoticeType).forEach((nt) => {
      expect(docTypes).toContain(nt);
    });
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe("Legal Navigation", () => {
  it("vendor portal should include Legal Cases nav item", () => {
    const vendorConfig = PORTAL_NAV_CONFIG.vendor;
    expect(vendorConfig).toBeDefined();

    const commGroup = vendorConfig.navGroups.find(
      (g) => g.title === "Communication"
    );
    expect(commGroup).toBeDefined();

    const legalItem = commGroup?.items.find(
      (i) => i.title === "Legal Cases"
    );
    expect(legalItem).toBeDefined();
    expect(legalItem?.href).toBe("/dashboard/vendor/legal");
    expect(legalItem?.icon).toBeDefined();
  });

  it("detectPortal should recognize vendor legal paths", () => {
    expect(detectPortal("/dashboard/vendor/legal")).toBe("vendor");
    expect(detectPortal("/dashboard/vendor/legal/case-001")).toBe("vendor");
  });
});
