// =============================================================================
// Inspection Module — Public API
// =============================================================================

// Types
export type {
  Inspection,
  InspectionItem,
  InspectionTenancyRef,
  InspectionFilters,
  InspectionFilterTab,
  InspectionStatusConfig,
  InspectionStatusVariant,
  InspectionTypeConfig,
  InspectionConditionConfig,
  InspectionCategoryConfig,
  ScheduleInspectionDto,
  CompleteInspectionDto,
  UpdateChecklistDto,
  RequestVideoDto,
  SubmitVideoDto,
  SubmitVideoResponse,
  ReviewVideoDto,
  InspectionVideoUrlResponse,
  VideoUploadStage,
  VideoUploadProgress,
} from "./types";

export {
  InspectionType,
  InspectionStatus,
  InspectionCategory,
  InspectionCondition,
  INSPECTION_STATUS_CONFIG,
  INSPECTION_TYPE_CONFIG,
  INSPECTION_CONDITION_CONFIG,
  INSPECTION_CATEGORY_CONFIG,
  INSPECTION_FILTER_TABS,
  INSPECTION_TIME_SLOTS,
  getStatusesForInspectionFilter,
  isTerminalInspectionStatus,
  canUploadVideo,
  canReviewVideo,
} from "./types";

// Hooks
export {
  useInspections,
  useInspection,
  useInspectionsByTenancy,
  useScheduleInspection,
  useCompleteInspection,
  useUpdateChecklist,
  useCancelInspection,
  useRescheduleInspection,
  useRequestVideo,
  useSubmitVideo,
  useReviewVideo,
  useInspectionVideo,
} from "./hooks";

// Components
export { InspectionStatusBadge } from "./components";
export { InspectionCard, InspectionCardSkeleton } from "./components";
export { InspectionList } from "./components";
export { InspectionScheduler } from "./components";
export {
  InspectionSummaryCard,
  InspectionSummaryCardSkeleton,
} from "./components";
export {
  InspectionDetail,
  InspectionDetailSkeleton,
} from "./components";
export { VideoPlayer, VideoPlayerSkeleton } from "./components";
export { VideoInspectionUploader } from "./components";
export { VideoReviewPanel } from "./components";
