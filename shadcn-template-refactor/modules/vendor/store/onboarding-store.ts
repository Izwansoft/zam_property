// =============================================================================
// Vendor Onboarding Store — Zustand store for multi-step form persistence
// =============================================================================
// Persists onboarding form data across steps so that data is not lost
// if the user navigates away and returns. Uses sessionStorage for
// tab-scoped persistence (cleared on tab close).
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VendorType } from "../types";

// ---------------------------------------------------------------------------
// Onboarding form data shape
// ---------------------------------------------------------------------------

export interface OnboardingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OnboardingFormData {
  // Step 1: Basic Info
  profileModel:
    | "COMPANY"
    | "PROPERTY_OWNER"
    | "INDIVIDUAL_AGENT"
    | "AGENT_UNDER_COMPANY"
    | "";
  name: string;
  type: VendorType | "";
  email: string;
  phone: string;
  description: string;
  companyId: string;
  companyName: string;
  agentId: string;
  agentName: string;

  // Step 2: Business Details
  registrationNumber: string;
  address: OnboardingAddress;

  // Step 3: Documents (file names stored — actual upload is placeholder)
  documentNames: string[];
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface OnboardingStore {
  /** Current step (1-based: 1, 2, 3, 4) */
  currentStep: number;
  /** Form data accumulated across steps */
  data: OnboardingFormData;
  /** Whether the onboarding has been submitted */
  isSubmitted: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingFormData>) => void;
  markSubmitted: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_ONBOARDING_DATA: OnboardingFormData = {
  // Step 1
  profileModel: "",
  name: "",
  type: "",
  email: "",
  phone: "",
  description: "",
  companyId: "",
  companyName: "",
  agentId: "",
  agentName: "",

  // Step 2
  registrationNumber: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "MY",
  },

  // Step 3
  documentNames: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: { ...DEFAULT_ONBOARDING_DATA },
      isSubmitted: false,

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(4, state.currentStep + 1),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(1, state.currentStep - 1),
        })),

      updateData: (partial) =>
        set((state) => ({
          data: { ...state.data, ...partial },
        })),

      markSubmitted: () => set({ isSubmitted: true }),

      reset: () =>
        set({
          currentStep: 1,
          data: { ...DEFAULT_ONBOARDING_DATA },
          isSubmitted: false,
        }),
    }),
    {
      name: "zam-vendor-onboarding",
      storage: createJSONStorage(() => {
        // SSR-safe: return no-op storage during SSR
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
    },
  ),
);
