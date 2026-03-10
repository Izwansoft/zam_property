// =============================================================================
// Review module — reviews, moderation, ratings display
// =============================================================================

// ---- Types ----
export type {
  ReviewStatus,
  ReviewSortBy,
  Review,
  ReviewDetail,
  ReviewEditEntry,
  ReviewStats,
  ReviewFilters,
  ApproveReviewDto,
  RejectReviewDto,
  FlagReviewDto,
  ReplyToReviewDto,
} from "./types";
export { DEFAULT_REVIEW_FILTERS } from "./types";

// ---- Utils ----
export {
  REVIEW_STATUS_CONFIG,
  getRatingLabel,
  getRatingColor,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  cleanReviewFilters,
} from "./utils";

// ---- Hooks ----
export { useReviews } from "./hooks/use-reviews";
export { useReviewDetail } from "./hooks/use-review-detail";
export { useReviewStats } from "./hooks/use-review-stats";
export {
  useApproveReview,
  useRejectReview,
  useFlagReview,
  useReplyToReview,
} from "./hooks/use-review-mutations";

// ---- Components ----
export { ReviewCard, ReviewCardSkeleton, StarRating } from "./components/review-card";
export { ReviewFiltersBar } from "./components/review-filters";
export { ReviewPagination } from "./components/review-pagination";
export { ReviewList } from "./components/review-list";
export { ReviewStatsDisplay, ReviewStatsSkeleton } from "./components/review-stats";
export { ReviewModerationActions } from "./components/review-moderation-actions";
export { ReviewReplyForm } from "./components/review-reply-form";
export { ReviewDetailView, ReviewDetailSkeleton } from "./components/review-detail";
