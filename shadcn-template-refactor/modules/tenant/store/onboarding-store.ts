// =============================================================================
// Tenant Onboarding Store — Zustand store for multi-step form persistence
// =============================================================================
// Persists onboarding form data across steps so that data is not lost
// if the user navigates away and returns. Uses sessionStorage for
// tab-scoped persistence (cleared on tab close).
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TenantDocumentType, EmergencyContact } from "../types";

// ---------------------------------------------------------------------------
// Onboarding form data shape
// ---------------------------------------------------------------------------

export interface UploadedDocument {
  id: string;
  type: TenantDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface TenantOnboardingFormData {
  // Step 1: Personal details
  fullName: string;
  icNumber: string;
  passportNumber: string;
  dateOfBirth: string;
  nationality: string;
  phone: string;

  // Employment details
  employmentStatus: string;
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  monthlyIncome: string;

  // Step 2: Documents (uploaded documents)
  documents: UploadedDocument[];

  // Step 3: Emergency contact
  emergencyContacts: EmergencyContact[];
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface TenantOnboardingStore {
  /** Current step (1-based: 1, 2, 3, 4) */
  currentStep: number;
  /** Form data accumulated across steps */
  data: TenantOnboardingFormData;
  /** Whether the onboarding has been submitted */
  isSubmitted: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<TenantOnboardingFormData>) => void;
  addDocument: (doc: UploadedDocument) => void;
  removeDocument: (docId: string) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (index: number) => void;
  markSubmitted: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_ONBOARDING_DATA: TenantOnboardingFormData = {
  // Step 1: Personal details
  fullName: "",
  icNumber: "",
  passportNumber: "",
  dateOfBirth: "",
  nationality: "Malaysian",
  phone: "",

  // Employment details
  employmentStatus: "",
  employerName: "",
  employerAddress: "",
  jobTitle: "",
  monthlyIncome: "",

  // Step 2: Documents
  documents: [],

  // Step 3: Emergency contact
  emergencyContacts: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTenantOnboardingStore = create<TenantOnboardingStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: { ...DEFAULT_ONBOARDING_DATA },
      isSubmitted: false,

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 4),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      updateData: (partial) =>
        set((state) => ({
          data: { ...state.data, ...partial },
        })),

      addDocument: (doc) =>
        set((state) => ({
          data: {
            ...state.data,
            documents: [...state.data.documents, doc],
          },
        })),

      removeDocument: (docId) =>
        set((state) => ({
          data: {
            ...state.data,
            documents: state.data.documents.filter((d) => d.id !== docId),
          },
        })),

      addEmergencyContact: (contact) =>
        set((state) => ({
          data: {
            ...state.data,
            emergencyContacts: [...state.data.emergencyContacts, contact],
          },
        })),

      removeEmergencyContact: (index) =>
        set((state) => ({
          data: {
            ...state.data,
            emergencyContacts: state.data.emergencyContacts.filter(
              (_, i) => i !== index
            ),
          },
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
      name: "tenant-onboarding",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
