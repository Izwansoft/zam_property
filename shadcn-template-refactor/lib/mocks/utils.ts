// =============================================================================
// MSW Mock Utilities — Helper factories for mock API responses
// =============================================================================
// All mock responses MUST match the 4 backend response formats from Part-23 §23.4.
// =============================================================================

// ---------------------------------------------------------------------------
// Request ID generator (for mock responses)
// ---------------------------------------------------------------------------

function mockRequestId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp-based
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Format A — Standard entity response
// ---------------------------------------------------------------------------

/**
 * Wraps data in the standard single-entity response format.
 * Used by: GET /listings/:id, /vendors/:id, etc.
 *
 * Shape: { data: T, meta: { requestId } }
 */
export function mockSuccessResponse<T>(data: T) {
  return {
    data,
    meta: {
      requestId: mockRequestId(),
    },
  };
}

// ---------------------------------------------------------------------------
// Format A — Standard paginated response
// ---------------------------------------------------------------------------

/**
 * Wraps items in Format A paginated response.
 * Used by: GET /listings, /vendors, /users, /interactions, /reviews, etc.
 *
 * Shape: { data: { items: T[], pagination: {...} }, meta: { requestId } }
 */
export function mockPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20,
  total?: number
) {
  const actualTotal = total ?? items.length;
  const totalPages = Math.ceil(actualTotal / pageSize);

  return {
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total: actualTotal,
        totalPages,
      },
    },
    meta: {
      requestId: mockRequestId(),
    },
  };
}

// ---------------------------------------------------------------------------
// Format B — Meta-paginated response
// ---------------------------------------------------------------------------

/**
 * Wraps items in Format B paginated response.
 * Used by: GET /search/listings, /notifications, /audit/logs
 *
 * Shape: { data: T[], meta: { requestId, pagination: {...}, facets? } }
 */
export function mockMetaPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20,
  totalItems?: number,
  facets?: Record<string, unknown>
) {
  const actualTotal = totalItems ?? items.length;
  const totalPages = Math.ceil(actualTotal / pageSize);

  return {
    data: items,
    meta: {
      requestId: mockRequestId(),
      pagination: {
        page,
        pageSize,
        totalItems: actualTotal,
        totalPages,
      },
      ...(facets ? { facets } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Audit log response (variant of Format B)
// ---------------------------------------------------------------------------

/**
 * Wraps audit log items in the expected response format.
 * Shape: { data: T[], meta: { total, filters: {...} } }
 */
export function mockAuditResponse<T>(
  items: T[],
  total?: number,
  filters?: Record<string, unknown>
) {
  return {
    data: items,
    meta: {
      requestId: mockRequestId(),
      total: total ?? items.length,
      filters: filters ?? {},
    },
  };
}

// ---------------------------------------------------------------------------
// Error response
// ---------------------------------------------------------------------------

/**
 * Creates a backend-formatted error response.
 * Shape: { error: { code, message, details? }, meta: { requestId, timestamp } }
 */
export function mockErrorResponse(
  code: string,
  message: string,
  details?: Array<{
    field: string;
    code: string;
    message: string;
    constraints?: Record<string, unknown>;
  }>
) {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      requestId: mockRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Data factories — reusable mock entities
// ---------------------------------------------------------------------------

let incrementId = 1000;

export function nextId(): string {
  return `mock-${++incrementId}`;
}

export function mockTimestamp(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}
