// =============================================================================
// Claim Module — Public API
// =============================================================================

// Types
export type {
  Claim,
  ClaimEvidence,
  ClaimTenancyRef,
  ClaimFilters,
  ClaimFilterTab,
  ClaimStatusConfig,
  ClaimStatusVariant,
  ClaimTypeConfig,
  EvidenceTypeConfig,
  CreateClaimDto,
  UploadEvidenceDto,
  UploadEvidenceResponse,
  ReviewClaimDto,
  DisputeClaimDto,
} from "./types";

export {
  ClaimType,
  ClaimStatus,
  EvidenceType,
  CLAIM_STATUS_CONFIG,
  CLAIM_TYPE_CONFIG,
  EVIDENCE_TYPE_CONFIG,
  CLAIM_FILTER_TABS,
  SETTLEMENT_METHOD_LABELS,
  getStatusesForClaimFilter,
  canReviewClaim,
  canDisputeClaim,
  isTerminalClaimStatus,
  formatClaimAmount,
} from "./types";

// Hooks
export {
  useClaims,
  useClaim,
  useCreateClaim,
  useReviewClaim,
  useDisputeClaim,
  useUploadEvidence,
} from "./hooks";

// Components
export {
  ClaimStatusBadge,
  ClaimCard,
  ClaimCardSkeleton,
  ClaimList,
  ClaimSubmissionForm,
  ClaimDetail,
  ClaimDetailSkeleton,
  ClaimReviewPanel,
  ClaimDisputePanel,
  ClaimEvidenceUploader,
} from "./components";
