/**
 * Unit Tests — Company Registration Store
 *
 * Tests Zustand store for multi-step company registration wizard:
 * step navigation, data persistence, submission lifecycle.
 *
 * @see modules/company/store/registration-store.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useCompanyRegistrationStore } from "../store/registration-store";
import { DEFAULT_REGISTRATION_DATA } from "../types";

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  act(() => {
    useCompanyRegistrationStore.getState().reset();
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("CompanyRegistrationStore — initial state", () => {
  it("starts at step 1 with default data", () => {
    const state = useCompanyRegistrationStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isSubmitted).toBe(false);
    expect(state.data).toEqual(DEFAULT_REGISTRATION_DATA);
  });

  it("has empty strings for all fields", () => {
    const { data } = useCompanyRegistrationStore.getState();
    expect(data.companyName).toBe("");
    expect(data.registrationNo).toBe("");
    expect(data.companyType).toBe("");
    expect(data.companyEmail).toBe("");
    expect(data.adminFullName).toBe("");
    expect(data.ssmDocumentUrl).toBe("");
    expect(data.selectedPlanId).toBe("");
    expect(data.paymentIntentId).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

describe("CompanyRegistrationStore — step navigation", () => {
  it("nextStep increments from 1 to 2", () => {
    act(() => useCompanyRegistrationStore.getState().nextStep());
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(2);
  });

  it("nextStep caps at step 6", () => {
    act(() => {
      const store = useCompanyRegistrationStore.getState();
      store.setCurrentStep(6 as 6);
      store.nextStep();
    });
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(6);
  });

  it("prevStep decrements from 3 to 2", () => {
    act(() => {
      useCompanyRegistrationStore.getState().setCurrentStep(3 as 3);
      useCompanyRegistrationStore.getState().prevStep();
    });
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(2);
  });

  it("prevStep does not go below 1", () => {
    act(() => useCompanyRegistrationStore.getState().prevStep());
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(1);
  });

  it("setCurrentStep jumps to arbitrary step", () => {
    act(() => useCompanyRegistrationStore.getState().setCurrentStep(4 as 4));
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(4);
  });

  it("navigates through all 6 steps sequentially", () => {
    for (let i = 1; i <= 5; i++) {
      act(() => useCompanyRegistrationStore.getState().nextStep());
    }
    expect(useCompanyRegistrationStore.getState().currentStep).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Data updates
// ---------------------------------------------------------------------------

describe("CompanyRegistrationStore — data updates", () => {
  it("updateData merges partial data", () => {
    act(() =>
      useCompanyRegistrationStore.getState().updateData({
        companyName: "Test Corp",
        companyEmail: "info@test.com",
      })
    );

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.companyName).toBe("Test Corp");
    expect(data.companyEmail).toBe("info@test.com");
    // Other fields remain default
    expect(data.registrationNo).toBe("");
  });

  it("updateData preserves existing fields", () => {
    act(() => {
      useCompanyRegistrationStore
        .getState()
        .updateData({ companyName: "First" });
      useCompanyRegistrationStore
        .getState()
        .updateData({ companyEmail: "test@example.com" });
    });

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.companyName).toBe("First");
    expect(data.companyEmail).toBe("test@example.com");
  });

  it("updateData overwrites existing fields", () => {
    act(() => {
      useCompanyRegistrationStore
        .getState()
        .updateData({ companyName: "Old Name" });
      useCompanyRegistrationStore
        .getState()
        .updateData({ companyName: "New Name" });
    });

    expect(useCompanyRegistrationStore.getState().data.companyName).toBe(
      "New Name"
    );
  });

  it("stores admin details", () => {
    act(() =>
      useCompanyRegistrationStore.getState().updateData({
        adminFullName: "John Doe",
        adminEmail: "john@test.com",
        adminPhone: "+60123456789",
        adminPassword: "Password1",
        adminConfirmPassword: "Password1",
      })
    );

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.adminFullName).toBe("John Doe");
    expect(data.adminEmail).toBe("john@test.com");
    expect(data.adminPassword).toBe("Password1");
  });

  it("stores document URLs", () => {
    act(() =>
      useCompanyRegistrationStore.getState().updateData({
        ssmDocumentUrl: "https://s3.example.com/ssm.pdf",
        businessLicenseUrl: "https://s3.example.com/license.pdf",
      })
    );

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.ssmDocumentUrl).toBe("https://s3.example.com/ssm.pdf");
    expect(data.businessLicenseUrl).toBe(
      "https://s3.example.com/license.pdf"
    );
  });

  it("stores package selection", () => {
    act(() =>
      useCompanyRegistrationStore.getState().updateData({
        selectedPlanId: "plan-professional",
        billingCycle: "yearly",
      })
    );

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.selectedPlanId).toBe("plan-professional");
    expect(data.billingCycle).toBe("yearly");
  });
});

// ---------------------------------------------------------------------------
// Submission lifecycle
// ---------------------------------------------------------------------------

describe("CompanyRegistrationStore — submission lifecycle", () => {
  it("markSubmitted sets isSubmitted to true", () => {
    act(() => useCompanyRegistrationStore.getState().markSubmitted());
    expect(useCompanyRegistrationStore.getState().isSubmitted).toBe(true);
  });

  it("reset restores initial state after submission", () => {
    act(() => {
      const store = useCompanyRegistrationStore.getState();
      store.updateData({ companyName: "Test Corp" });
      store.setCurrentStep(4 as 4);
      store.markSubmitted();
      store.reset();
    });

    const state = useCompanyRegistrationStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isSubmitted).toBe(false);
    expect(state.data).toEqual(DEFAULT_REGISTRATION_DATA);
  });

  it("reset clears partial data", () => {
    act(() => {
      useCompanyRegistrationStore.getState().updateData({
        companyName: "Acme",
        adminFullName: "Jane",
        ssmDocumentUrl: "http://example.com/doc.pdf",
      });
      useCompanyRegistrationStore.getState().reset();
    });

    const { data } = useCompanyRegistrationStore.getState();
    expect(data.companyName).toBe("");
    expect(data.adminFullName).toBe("");
    expect(data.ssmDocumentUrl).toBe("");
  });
});
