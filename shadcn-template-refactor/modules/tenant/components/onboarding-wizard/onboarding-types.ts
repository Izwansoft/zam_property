// =============================================================================
// Tenant Onboarding Types
// =============================================================================

export type OnboardingStepId = 1 | 2 | 3 | 4;

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly label: string;
  readonly description: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 1,
    label: "Personal Details",
    description: "Your personal information",
  },
  {
    id: 2,
    label: "Documents",
    description: "Upload verification documents",
  },
  {
    id: 3,
    label: "Emergency Contact",
    description: "Emergency contact information",
  },
  {
    id: 4,
    label: "Review",
    description: "Review and submit",
  },
] as const;

// Employment status options
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "EMPLOYED", label: "Employed" },
  { value: "SELF_EMPLOYED", label: "Self-Employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
  { value: "STUDENT", label: "Student" },
  { value: "RETIRED", label: "Retired" },
] as const;

// Nationality options (common Malaysian nationalities)
export const NATIONALITY_OPTIONS = [
  { value: "Malaysian", label: "Malaysian" },
  { value: "Singaporean", label: "Singaporean" },
  { value: "Indonesian", label: "Indonesian" },
  { value: "Thai", label: "Thai" },
  { value: "Filipino", label: "Filipino" },
  { value: "Chinese", label: "Chinese" },
  { value: "Indian", label: "Indian" },
  { value: "Other", label: "Other" },
] as const;

// Relationship options for emergency contacts
export const RELATIONSHIP_OPTIONS = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "PARENT", label: "Parent" },
  { value: "SIBLING", label: "Sibling" },
  { value: "CHILD", label: "Child" },
  { value: "RELATIVE", label: "Relative" },
  { value: "FRIEND", label: "Friend" },
  { value: "COLLEAGUE", label: "Colleague" },
  { value: "OTHER", label: "Other" },
] as const;
