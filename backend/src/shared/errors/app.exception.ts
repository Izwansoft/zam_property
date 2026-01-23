import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorDetail } from './error-response.interface';

/**
 * Application-level exception with structured error format.
 * Extends NestJS HttpException to carry error code, message, details, and metadata.
 */
export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: ErrorDetail[];
  public readonly metadata?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: ErrorDetail[],
    metadata?: Record<string, unknown>,
  ) {
    // HttpException expects (response: string | Record, status: number)
    super({ code, message, details, metadata }, statusCode);
    this.code = code;
    this.details = details;
    this.metadata = metadata;
  }

  /**
   * Factory for validation errors with field-level details.
   */
  static validation(details: ErrorDetail[], message = 'Validation failed'): AppException {
    return new AppException('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST, details);
  }

  /**
   * Factory for 400 Bad Request errors.
   */
  static badRequest(
    code: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, HttpStatus.BAD_REQUEST, undefined, metadata);
  }

  /**
   * Factory for 401 Unauthorized errors.
   */
  static unauthorized(
    code: string = 'UNAUTHORIZED',
    message: string = 'Authentication required',
  ): AppException {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED);
  }

  /**
   * Factory for 403 Forbidden errors.
   */
  static forbidden(
    code: string = 'FORBIDDEN',
    message: string = 'Access denied',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN, undefined, metadata);
  }

  /**
   * Factory for 404 Not Found errors.
   */
  static notFound(
    code: string = 'NOT_FOUND',
    message: string = 'Resource not found',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND, undefined, metadata);
  }

  /**
   * Factory for 409 Conflict errors.
   */
  static conflict(
    code: string = 'CONFLICT',
    message: string = 'Resource already exists',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT, undefined, metadata);
  }

  /**
   * Factory for 429 Too Many Requests errors.
   */
  static rateLimited(
    code: string = 'RATE_LIMITED',
    message: string = 'Rate limit exceeded',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, HttpStatus.TOO_MANY_REQUESTS, undefined, metadata);
  }

  /**
   * Factory for 500 Internal Server Error.
   */
  static internal(
    message: string = 'An unexpected error occurred',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(
      'INTERNAL_ERROR',
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      metadata,
    );
  }

  /**
   * Factory for 503 Service Unavailable.
   */
  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    metadata?: Record<string, unknown>,
  ): AppException {
    return new AppException(
      'SERVICE_UNAVAILABLE',
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      undefined,
      metadata,
    );
  }
}
