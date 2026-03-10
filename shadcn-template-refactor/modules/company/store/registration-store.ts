// =============================================================================
// Company Registration Store — Zustand store for multi-step form persistence
// =============================================================================
// Persists registration form data across steps so that data is not lost
// if the user navigates away and returns. Uses sessionStorage for
// tab-scoped persistence (cleared on tab close).
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CompanyRegistrationData, RegistrationStepId } from "../types";
import { DEFAULT_REGISTRATION_DATA, REGISTRATION_STEPS } from "../types";

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface CompanyRegistrationStore {
  /** Current step (1-based: 1–6) */
  currentStep: RegistrationStepId;
  /** Form data accumulated across steps */
  data: CompanyRegistrationData;
  /** Whether the registration has been submitted */
  isSubmitted: boolean;

  // Actions
  setCurrentStep: (step: RegistrationStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<CompanyRegistrationData>) => void;
  markSubmitted: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_STEP = REGISTRATION_STEPS.length as RegistrationStepId;

export const useCompanyRegistrationStore =
  create<CompanyRegistrationStore>()(
    persist(
      (set) => ({
        currentStep: 1 as RegistrationStepId,
        data: { ...DEFAULT_REGISTRATION_DATA },
        isSubmitted: false,

        setCurrentStep: (step) => set({ currentStep: step }),

        nextStep: () =>
          set((state) => ({
            currentStep: Math.min(
              state.currentStep + 1,
              MAX_STEP
            ) as RegistrationStepId,
          })),

        prevStep: () =>
          set((state) => ({
            currentStep: Math.max(
              state.currentStep - 1,
              1
            ) as RegistrationStepId,
          })),

        updateData: (partial) =>
          set((state) => ({
            data: { ...state.data, ...partial },
          })),

        markSubmitted: () => set({ isSubmitted: true }),

        reset: () =>
          set({
            currentStep: 1 as RegistrationStepId,
            data: { ...DEFAULT_REGISTRATION_DATA },
            isSubmitted: false,
          }),
      }),
      {
        name: "company-registration",
        storage: createJSONStorage(() => sessionStorage),
      }
    )
  );
