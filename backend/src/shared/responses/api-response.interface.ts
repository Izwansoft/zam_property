/**
 * Standard success response format per part-15.md
 */

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Request correlation ID */
  requestId?: string;
  /** ISO 8601 timestamp */
  timestamp?: string;
  /** Pagination information (for list endpoints) */
  pagination?: PaginationMeta;
}

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  /** Response payload */
  data: T;
  /** Response metadata */
  meta?: ResponseMeta;
}

/**
 * Standard list response wrapper with pagination
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination and response metadata */
  meta: ResponseMeta & { pagination: PaginationMeta };
}

/**
 * Helper to create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  requestId?: string,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString(),
      pagination,
    },
  };
}

/**
 * Helper to calculate pagination metadata
 */
export function calculatePagination(page: number, pageSize: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Helper to create a simple API response
 */
export function createApiResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    data,
    meta: {
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString(),
    },
  };
}
