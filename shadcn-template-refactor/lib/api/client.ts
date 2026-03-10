// =============================================================================
// API Client — Axios instance with interceptors
// =============================================================================
// Central HTTP client for all backend requests.
// Domain modules MUST use this client (never raw axios).
// =============================================================================

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

// ---------------------------------------------------------------------------
// Response Types (Backend Part-23 §23.4)
// ---------------------------------------------------------------------------

/** Single entity response: GET /listings/:id, /vendors/:id, etc. */
export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
  };
}

/** Format A — Standard paginated (listings, vendors, users, interactions, etc.) */
export interface PaginatedResponseA<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  meta: {
    requestId: string;
  };
}

/** Format B — Meta pagination (search, notifications, audit) */
export interface PaginatedResponseB<T> {
  data: T[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: Record<string, unknown>;
  };
}

/** Format C — Public search (OpenSearch) */
export interface PublicSearchResponse<T> {
  data: {
    hits: T[];
    total: number;
    aggregations: Record<string, unknown>;
  };
}

/** Format D — Admin jobs (non-standard) */
export interface AdminJobsResponse<T> {
  jobs: T[];
  total: number;
}

/** Format E — Legacy paginated (rent-payments, payouts) */
export interface LegacyPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/** Normalized pagination result — unified shape for UI */
export interface NormalizedPaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Standard pagination query params */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}

// ---------------------------------------------------------------------------
// Normalizer — converts any backend paginated format to common shape
// ---------------------------------------------------------------------------

export function normalizePaginated<T>(
  response: unknown,
  format: "A" | "B" | "C" | "D" | "E"
): NormalizedPaginatedResult<T> {
  switch (format) {
    case "A": {
      const r = response as PaginatedResponseA<T>;
      return {
        items: r.data.items,
        pagination: r.data.pagination,
      };
    }
    case "B": {
      const r = response as PaginatedResponseB<T>;
      return {
        items: r.data,
        pagination: {
          page: r.meta.pagination.page,
          pageSize: r.meta.pagination.pageSize,
          total: r.meta.pagination.totalItems,
          totalPages: r.meta.pagination.totalPages,
        },
      };
    }
    case "C": {
      const r = response as PublicSearchResponse<T>;
      return {
        items: r.data.hits,
        pagination: {
          page: 1,
          pageSize: r.data.hits.length,
          total: r.data.total,
          totalPages: 1,
        },
      };
    }
    case "D": {
      const r = response as AdminJobsResponse<T>;
      return {
        items: r.jobs,
        pagination: {
          page: 1,
          pageSize: r.total,
          total: r.total,
          totalPages: 1,
        },
      };
    }
    case "E": {
      const r = response as LegacyPaginatedResponse<T>;
      const pageSize = r.limit || 20;
      return {
        items: r.data,
        pagination: {
          page: r.page || 1,
          pageSize,
          total: r.total,
          totalPages: r.totalPages ?? Math.ceil(r.total / pageSize),
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// UUID helper (crypto-based)
// ---------------------------------------------------------------------------

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Token getter — singleton, set by AuthProvider (Session 1.4)
// ---------------------------------------------------------------------------

let _getAccessToken: (() => string | null) | null = null;

export function setTokenGetter(getter: () => string | null): void {
  _getAccessToken = getter;
}

// ---------------------------------------------------------------------------
// Partner ID getter — singleton, set by PartnerProvider (Session 1.9)
// ---------------------------------------------------------------------------

let _getPartnerId: (() => string | null) | null = null;

export function setPartnerIdGetter(getter: () => string | null): void {
  _getPartnerId = getter;
}

// ---------------------------------------------------------------------------
// Portal getter — singleton, set by layout (Session 1.7)
// ---------------------------------------------------------------------------

let _getPortal: (() => string | null) | null = null;

export function setPortalGetter(getter: () => string | null): void {
  _getPortal = getter;
}

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — attach context headers
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // X-Request-Id — UUID per request for tracing
    const requestId = generateRequestId();
    config.headers.set("X-Request-Id", requestId);

    // X-Client — identifies the frontend app
    config.headers.set("X-Client", "web-dashboard");

    // Authorization — Bearer token (set by AuthProvider)
    const token = _getAccessToken?.();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    // X-Partner-ID — partner context (set by PartnerProvider)
    // Skip if already set by per-request axiosConfig (e.g. partnerScope override)
    if (!config.headers.get("X-Partner-ID")) {
      const partnerId =
        _getPartnerId?.() ||
        process.env.NEXT_PUBLIC_DEFAULT_PARTNER ||
        "lamaniaga";
      config.headers.set("X-Partner-ID", partnerId);
    }

    // X-Portal — current portal context
    const portal = _getPortal?.();
    if (portal) {
      config.headers.set("X-Portal", portal);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Token Refresh Getter — singleton, set by AuthProvider (Session 1.4)
// ---------------------------------------------------------------------------

let _refreshSession: (() => Promise<boolean>) | null = null;

export function setRefreshHandler(handler: () => Promise<boolean>): void {
  _refreshSession = handler;
}

// ---------------------------------------------------------------------------
// Response Interceptor — 401 token refresh with request queue
// ---------------------------------------------------------------------------
// On 401: attempt token refresh, then retry the original request.
// Concurrent requests that hit 401 are queued and retried after refresh.
// ---------------------------------------------------------------------------

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function emitAuthInvalidEvent(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("zam:auth-invalid"));
  }
}

function processQueue(error: unknown | null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isMeRequest = url.includes("/users/me");

    // If retried request still fails with 401 on identity endpoint,
    // force a local auth reset to prevent stale-token loops.
    if (
      error.response?.status === 401 &&
      originalRequest?._retry &&
      isMeRequest
    ) {
      emitAuthInvalidEvent();
    }

    // Only attempt refresh on 401 responses
    if (
      error.response?.status !== 401 ||
      !_refreshSession ||
      originalRequest._retry
    ) {
      if (error.response?.status === 401 && isMeRequest && !_refreshSession) {
        emitAuthInvalidEvent();
      }
      return Promise.reject(error);
    }

    // Don't refresh on auth endpoints (prevent infinite loop)
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // After refresh succeeds, retry with new token
        const newToken = _getAccessToken?.();
        if (newToken) {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const success = await _refreshSession();

      if (success) {
        // Update the original request with new token
        const newToken = _getAccessToken?.();
        if (newToken) {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        }

        processQueue(null);
        return apiClient(originalRequest);
      } else {
        if (isMeRequest) {
          emitAuthInvalidEvent();
        }
        processQueue(error);
        return Promise.reject(error);
      }
    } catch (refreshError) {
      if (isMeRequest) {
        emitAuthInvalidEvent();
      }
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---------------------------------------------------------------------------
// Convenience alias
// ---------------------------------------------------------------------------

export const api = apiClient;
