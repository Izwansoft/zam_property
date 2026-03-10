// =============================================================================
// Vendor Onboarding Form Types — Step definitions and constants
// =============================================================================

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export const ONBOARDING_STEPS = [
  { id: 1, label: "Basic Info", description: "Name, type, and contact" },
  { id: 2, label: "Business", description: "Registration and address" },
  { id: 3, label: "Documents", description: "Verification files" },
  { id: 4, label: "Review", description: "Review and submit" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];
