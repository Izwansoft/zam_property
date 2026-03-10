// =============================================================================
// Legal Module — Public API
// =============================================================================

// Types
export type {
  LegalCase,
  LegalDocument,
  LegalCaseTenancyRef,
  PanelLawyer,
  LegalCaseFilters,
  LegalCaseFilterTab,
  LegalStatusConfig,
  LegalStatusVariant,
  LegalReasonConfig,
  LegalDocTypeConfig,
  NoticeTypeConfig,
  CreateLegalCaseDto,
  UpdateLegalCaseDto,
  AssignLawyerDto,
  GenerateNoticeDto,
  ResolveCaseDto,
  UploadLegalDocumentDto,
} from "./types";

export {
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
} from "./types";

// Hooks
export {
  useLegalCases,
  useLegalCase,
  useLegalCaseDocuments,
  useCreateLegalCase,
  useUpdateLegalCase,
  useAssignLawyer,
  useGenerateNotice,
  useUpdateCaseStatus,
  useResolveCase,
  useUploadLegalDocument,
  usePanelLawyers,
  usePanelLawyer,
} from "./hooks";

// Components
export {
  LegalCaseList,
  LegalCaseCardSkeleton,
  LegalCaseListSkeleton,
  LegalCaseDetail,
  LegalCaseDetailSkeleton,
} from "./components";
