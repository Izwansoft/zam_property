import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsAuthService } from '../services/ws-auth.service';
import { BroadcastService } from '../services/broadcast.service';
import {
  AuthenticatedSocket,
  ROOM_NAMES,
  WsErrorCode,
  WsErrorResponse,
  WsSuccessResponse,
} from '../types';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

/**
 * Platform namespace gateway.
 *
 * Handles platform-admin scoped events:
 * - System-wide partner activity
 * - Audit log events
 * - Job/task notifications
 * - Admin dashboard real-time updates
 *
 * Authentication: Required (SUPER_ADMIN only)
 */
@WebSocketGateway({
  namespace: '/platform',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PlatformGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PlatformGateway.name);

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly broadcastService: BroadcastService,
  ) {}

  afterInit(server: Server): void {
    this.broadcastService.setPlatformServer(server);
    this.logger.log('Platform WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const error = await this.wsAuthService.authenticate(socket);

    if (error) {
      this.logger.debug(`Connection rejected: ${error}`);
      socket.emit('error', {
        code: error,
        message: this.getErrorMessage(error),
      } as WsErrorResponse);
      socket.disconnect(true);
      return;
    }

    // Verify this is a platform admin
    if (!this.wsAuthService.isPlatformAdmin(socket)) {
      this.logger.warn(
        `Non-admin user ${socket.data.userId} attempted platform WebSocket connection`,
      );
      socket.emit('error', {
        code: WsErrorCode.FORBIDDEN,
        message: 'Platform admin access required',
      } as WsErrorResponse);
      socket.disconnect(true);
      return;
    }

    // Auto-join user room for personal notifications
    socket.join(ROOM_NAMES.user(socket.data.userId));

    this.logger.log(
      `Platform admin ${socket.data.userId} connected (socket: ${socket.id})`,
    );

    socket.emit('connected', {
      userId: socket.data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.data?.userId) {
      this.logger.log(
        `Platform admin ${socket.data.userId} disconnected (socket: ${socket.id})`,
      );
    }
  }

  /**
   * Join a specific room for targeted updates.
   */
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() payload: { room: string },
  ): WsSuccessResponse {
    if (!payload?.room) {
      return { success: true };
    }

    socket.join(payload.room);
    this.logger.debug(`Admin ${socket.data.userId} joined room: ${payload.room}`);

    return { success: true, data: { room: payload.room } };
  }

  /**
   * Leave a room.
   */
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() payload: { room: string },
  ): WsSuccessResponse {
    if (!payload?.room) {
      return { success: true };
    }

    socket.leave(payload.room);
    this.logger.debug(`Admin ${socket.data.userId} left room: ${payload.room}`);

    return { success: true, data: { room: payload.room } };
  }

  /**
   * Ping handler for connection health checks.
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: AuthenticatedSocket): WsSuccessResponse {
    return { success: true, data: { pong: Date.now() } };
  }

  private getErrorMessage(code: WsErrorCode): string {
    switch (code) {
      case WsErrorCode.UNAUTHORIZED:
        return 'Authentication required';
      case WsErrorCode.TOKEN_EXPIRED:
        return 'Token has expired';
      case WsErrorCode.TENANT_ACCESS_DENIED:
        return 'Partner access denied';
      case WsErrorCode.FORBIDDEN:
        return 'Platform admin access required';
      case WsErrorCode.RATE_LIMITED:
        return 'Rate limit exceeded';
      default:
        return 'Connection error';
    }
  }
}
