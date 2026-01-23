/**
 * Standard error response format per part-15.md
 */

export interface ErrorDetail {
  /**
   * The field name that has the validation error
   */
  field: string;
  /**
   * Machine-readable error code (e.g., REQUIRED, INVALID_FORMAT)
   */
  code: string;
  /**
   * Human-readable error message
   */
  message: string;
  /**
   * Additional constraint details
   */
  constraints?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: {
    /**
     * Machine-readable error code (e.g., VALIDATION_ERROR, NOT_FOUND)
     */
    code: string;
    /**
     * Human-readable error message
     */
    message: string;
    /**
     * Field-level validation errors (for VALIDATION_ERROR)
     */
    details?: ErrorDetail[];
    /**
     * Additional context (non-sensitive)
     */
    metadata?: Record<string, unknown>;
  };
  meta: {
    /**
     * Request correlation ID for tracing
     */
    requestId: string;
    /**
     * ISO 8601 timestamp
     */
    timestamp: string;
  };
}
