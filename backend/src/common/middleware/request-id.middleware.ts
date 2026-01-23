import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '@shared/constants';

/**
 * Middleware that ensures every request has a unique X-Request-ID.
 * If the client provides one, it is reused; otherwise, a new UUID is generated.
 * Runs before all other middleware to ensure error responses include requestId.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    let requestId = req.headers[REQUEST_ID_HEADER.toLowerCase()] as string | undefined;

    if (!requestId) {
      requestId = randomUUID();
      req.headers[REQUEST_ID_HEADER.toLowerCase()] = requestId;
    }

    // Echo back in response headers
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
