// Common components — error boundaries, skeletons, guards, page templates
export { ProtectedRoute } from "./protected-route";
export type { ProtectedRouteProps } from "./protected-route";

export { GuestRoute } from "./guest-route";
export type { GuestRouteProps } from "./guest-route";

// Breadcrumb
export { AutoBreadcrumb } from "./auto-breadcrumb";
export type { AutoBreadcrumbProps, BreadcrumbOverride } from "./auto-breadcrumb";

// Page Header
export { PageHeader, PageHeaderSkeleton } from "./page-header";
export type { PageHeaderProps, PageAction, StatusBadge } from "./page-header";

// Page Templates
export { ListPage, ListPageSkeleton } from "./list-page";
export type {
  ListPageProps,
  FilterConfig,
  FilterOption,
  SortOption,
  ListPagePagination,
  ViewMode,
} from "./list-page";

export { DetailPage, DetailPageSkeleton } from "./detail-page";
export type {
  DetailPageProps,
  DetailTab,
  DetailSection,
} from "./detail-page";

export { FormPage, FormPageSkeleton } from "./form-page";
export type {
  FormPageProps,
  FormSection,
  FormPageAction,
} from "./form-page";

// Empty State
export { EmptyState } from "./empty-state";
