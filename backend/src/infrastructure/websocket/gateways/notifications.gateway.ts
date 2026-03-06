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
import { PrismaService } from '../../database/prisma.service';
import { WsAuthService } from '../services/ws-auth.service';
import { BroadcastService } from '../services/broadcast.service';
import {
  AuthenticatedSocket,
  ROOM_NAMES,
  WsErrorCode,
  WsErrorResponse,
  WsSuccessResponse,
} from '../types';
import { NotificationReadDto } from '../dto';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

/**
 * Notifications namespace gateway.
 *
 * Per Part 33.2 - handles user notification events:
 * - New notifications
 * - Mark as read
 * - Unread count updates
 *
 * Authentication: Required (authenticated user)
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly broadcastService: BroadcastService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server): void {
    this.broadcastService.setNotificationsServer(server);
    this.logger.log('Notifications WebSocket Gateway initialized');
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

    // Auto-join user room for personal notifications
    socket.join(ROOM_NAMES.user(socket.data.userId));

    // Also join partner room for partner-wide announcements
    socket.join(ROOM_NAMES.partner(socket.data.partnerId));

    this.logger.log(`User ${socket.data.userId} connected to notifications (socket: ${socket.id})`);

    // Send initial unread count
    const unreadCount = await this.getUnreadCount(socket.data.userId);
    socket.emit('notification:count', { unreadCount });

    socket.emit('connected', {
      userId: socket.data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.data?.userId) {
      this.logger.log(
        `User ${socket.data.userId} disconnected from notifications (socket: ${socket.id})`,
      );
    }
  }

  /**
   * Mark a notification as read.
   */
  @SubscribeMessage('notification:read')
  async handleNotificationRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: NotificationReadDto,
  ): Promise<WsSuccessResponse | WsErrorResponse> {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: data.notificationId,
        userId: socket.data.userId,
      },
    });

    if (!notification) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Notification not found' };
    }

    // Mark as read
    await this.prisma.notification.update({
      where: { id: data.notificationId },
      data: { readAt: new Date() },
    });

    this.logger.debug(
      `User ${socket.data.userId} marked notification ${data.notificationId} as read`,
    );

    // Send updated count
    const unreadCount = await this.getUnreadCount(socket.data.userId);
    socket.emit('notification:count', { unreadCount });

    return { success: true };
  }

  /**
   * Mark all notifications as read.
   */
  @SubscribeMessage('notification:read-all')
  async handleMarkAllRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<WsSuccessResponse> {
    await this.prisma.notification.updateMany({
      where: {
        userId: socket.data.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    this.logger.debug(`User ${socket.data.userId} marked all notifications as read`);

    socket.emit('notification:count', { unreadCount: 0 });

    return { success: true };
  }

  /**
   * Get current unread count.
   */
  @SubscribeMessage('notification:get-count')
  async handleGetCount(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.getUnreadCount(socket.data.userId);
    return { unreadCount };
  }

  /**
   * Ping handler for keep-alive.
   */
  @SubscribeMessage('ping')
  handlePing(): { pong: number } {
    return { pong: Date.now() };
  }

  private async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId: userId,
        readAt: null,
      },
    });
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
        return 'Access forbidden';
      default:
        return 'Connection error';
    }
  }
}
