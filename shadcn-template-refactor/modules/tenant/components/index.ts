// =============================================================================
// Tenant Module Components — Barrel Export
// =============================================================================

// Status badge
export { TenantStatusBadge } from "./tenant-status-badge";

// Document uploader
export { DocumentUploader, type DocumentUploaderProps } from "./document-uploader";

// Onboarding wizard
export {
  OnboardingWizard,
  OnboardingWizardSkeleton,
  ONBOARDING_STEPS,
  type OnboardingStepId,
  type OnboardingFormValues,
  type PersonalDetailsValues,
  type DocumentsValues,
  type EmergencyContactValues,
} from "./onboarding-wizard";
