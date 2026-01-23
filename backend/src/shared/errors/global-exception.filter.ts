import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from './app.exception';
import { ErrorResponse, ErrorDetail } from './error-response.interface';
import { REQUEST_ID_HEADER } from '../constants/headers.constant';

/**
 * Maps HTTP status code to a default error code when no specific code is provided.
 */
const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.GONE]: 'GONE',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/**
 * Global exception filter that transforms all exceptions into a standard
 * ErrorResponse format per part-15.md specification.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.getRequestId(request);
    const timestamp = new Date().toISOString();

    let status: number;
    let code: string;
    let message: string;
    let details: ErrorDetail[] | undefined;
    let metadata: Record<string, unknown> | undefined;

    if (exception instanceof AppException) {
      // Our custom AppException
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
      metadata = exception.metadata;
    } else if (exception instanceof HttpException) {
      // NestJS built-in HttpException (including validation errors)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        code = STATUS_CODE_MAP[status] || 'INTERNAL_ERROR';
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;

        // Handle class-validator ValidationPipe errors
        if (Array.isArray(resp.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Validation failed';
          details = this.parseValidationErrors(resp.message);
        } else {
          code = (resp.code as string) || STATUS_CODE_MAP[status] || 'INTERNAL_ERROR';
          message = (resp.message as string) || exception.message;
          details = resp.details as ErrorDetail[] | undefined;
          metadata = resp.metadata as Record<string, unknown> | undefined;
        }
      } else {
        code = STATUS_CODE_MAP[status] || 'INTERNAL_ERROR';
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Unexpected errors (should not leak stack traces)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';

      // Log the actual error for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        `RequestId: ${requestId}`,
      );
    } else {
      // Unknown error type
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';

      this.logger.error(`Unknown exception type`, String(exception), `RequestId: ${requestId}`);
    }

    const errorResponse: ErrorResponse = {
      error: {
        code,
        message,
        ...(details && { details }),
        ...(metadata && { metadata }),
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    // Log the error (not for validation errors in production to reduce noise)
    if (code !== 'VALIDATION_ERROR') {
      this.logger.warn(
        `[${status}] ${code}: ${message}`,
        `RequestId: ${requestId}, Path: ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Extract request ID from header, or use a placeholder if not set.
   */
  private getRequestId(request: Request): string {
    return (request.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || 'unknown';
  }

  /**
   * Parse class-validator error messages into ErrorDetail array.
   * ValidationPipe returns messages like "email must be an email" or full constraint objects.
   */
  private parseValidationErrors(messages: unknown[]): ErrorDetail[] {
    const details: ErrorDetail[] = [];

    for (const item of messages) {
      if (typeof item === 'string') {
        // Simple string message: try to extract field name
        const match = item.match(/^(\w+)\s+(.+)$/);
        if (match) {
          details.push({
            field: match[1],
            code: 'INVALID_FORMAT',
            message: item,
          });
        } else {
          details.push({
            field: 'unknown',
            code: 'INVALID_FORMAT',
            message: item,
          });
        }
      } else if (typeof item === 'object' && item !== null) {
        // Object with property and constraints
        const obj = item as Record<string, unknown>;
        const field = (obj.property as string) || 'unknown';
        const constraints = obj.constraints as Record<string, string> | undefined;

        if (constraints) {
          // Each constraint becomes a detail entry
          for (const [constraintKey, constraintMessage] of Object.entries(constraints)) {
            details.push({
              field,
              code: this.constraintToCode(constraintKey),
              message: constraintMessage,
            });
          }
        } else {
          details.push({
            field,
            code: 'INVALID_FORMAT',
            message: (obj.message as string) || 'Validation failed',
          });
        }
      }
    }

    return details;
  }

  /**
   * Map class-validator constraint keys to our error codes.
   */
  private constraintToCode(constraint: string): string {
    const mapping: Record<string, string> = {
      isNotEmpty: 'REQUIRED',
      isEmail: 'INVALID_FORMAT',
      isString: 'INVALID_TYPE',
      isNumber: 'INVALID_TYPE',
      isInt: 'INVALID_TYPE',
      isBoolean: 'INVALID_TYPE',
      isArray: 'INVALID_TYPE',
      isObject: 'INVALID_TYPE',
      isUUID: 'INVALID_FORMAT',
      isUrl: 'INVALID_FORMAT',
      isEnum: 'INVALID_ENUM',
      minLength: 'TOO_SHORT',
      maxLength: 'TOO_LONG',
      min: 'TOO_SMALL',
      max: 'TOO_LARGE',
      matches: 'INVALID_PATTERN',
      isIn: 'INVALID_ENUM',
      isOptional: 'INVALID_FORMAT',
      isDefined: 'REQUIRED',
      isDateString: 'INVALID_FORMAT',
      isISO8601: 'INVALID_FORMAT',
      isPhoneNumber: 'INVALID_FORMAT',
      isPositive: 'TOO_SMALL',
      isNegative: 'TOO_LARGE',
      arrayMinSize: 'TOO_SHORT',
      arrayMaxSize: 'TOO_LONG',
      arrayUnique: 'DUPLICATE',
    };

    return mapping[constraint] || 'INVALID_FORMAT';
  }
}
