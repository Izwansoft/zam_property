// =============================================================================
// Tenant Module Hooks — Barrel Export
// =============================================================================

// Profile hooks
export {
  useTenantProfile,
  useUpdateTenantProfile,
  tenantKeys,
} from "./use-tenant-profile";

// Document upload hook
export { useUploadTenantDocument } from "./use-upload-document";

// Onboarding hook
export { useSubmitTenantOnboarding, type SubmitOnboardingDto } from "./use-tenant-onboarding";
