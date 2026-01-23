import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants/headers.constant';

/**
 * Interceptor that ensures every request has a unique X-Request-ID.
 * If the client provides one, it is reused; otherwise, a new UUID is generated.
 * The request ID is also set on the response headers for client correlation.
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Use existing header or generate a new UUID
    let requestId = request.headers[REQUEST_ID_HEADER.toLowerCase()] as string | undefined;
    if (!requestId) {
      requestId = randomUUID();
      // Set on request so it can be accessed downstream
      request.headers[REQUEST_ID_HEADER.toLowerCase()] = requestId;
    }

    // Echo back in response headers
    response.setHeader(REQUEST_ID_HEADER, requestId);

    return next.handle();
  }
}
