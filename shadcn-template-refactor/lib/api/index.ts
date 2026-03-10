// API barrel — re-exports from client and types
export { api, apiClient } from "./client";
export type {
  ApiResponse,
  PaginatedResponseA,
  PaginatedResponseB,
  PublicSearchResponse,
  AdminJobsResponse,
  NormalizedPaginatedResult,
  PaginationParams,
} from "./client";
export { normalizePaginated, setRefreshHandler } from "./client";

// Path constants
export { API_PATHS } from "./paths";
