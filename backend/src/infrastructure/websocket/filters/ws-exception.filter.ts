import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { WsErrorCode, WsErrorResponse } from '../types';

/**
 * WebSocket exception filter for handling errors.
 *
 * Per Part 33.10 - all errors must be properly handled and logged.
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    let response: WsErrorResponse;

    if (exception instanceof WsException) {
      const wsError = exception.getError();
      if (typeof wsError === 'object' && wsError !== null && 'code' in wsError) {
        response = wsError as WsErrorResponse;
      } else {
        response = {
          code: WsErrorCode.CONNECTION_ERROR,
          message: String(wsError),
        };
      }
    } else if (exception instanceof Error) {
      // Validation pipe errors
      if ('response' in exception) {
        const validationResponse = (
          exception as Error & { response?: { message?: string | string[] } }
        ).response;
        response = {
          code: WsErrorCode.INVALID_PAYLOAD,
          message: Array.isArray(validationResponse?.message)
            ? validationResponse.message.join(', ')
            : validationResponse?.message || 'Validation failed',
        };
      } else {
        response = {
          code: WsErrorCode.CONNECTION_ERROR,
          message: exception.message,
        };
      }
    } else {
      response = {
        code: WsErrorCode.CONNECTION_ERROR,
        message: 'An unexpected error occurred',
      };
    }

    this.logger.warn(`WebSocket error: ${response.code} - ${response.message}`, {
      data,
      socketId: client.id,
    });

    client.emit('error', response);
  }
}
