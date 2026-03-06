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
import { JoinVendorDto, LeaveVendorDto, SendMessageDto, TypingDto, MarkReadDto } from '../dto';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

/**
 * Vendor namespace gateway.
 *
 * Per Part 33.2 - handles vendor-specific events:
 * - New leads/interactions
 * - Messages and chat
 * - Listing updates for owned listings
 *
 * Authentication: Required (vendor user)
 */
@WebSocketGateway({
  namespace: '/vendor',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VendorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(VendorGateway.name);

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly broadcastService: BroadcastService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server): void {
    this.broadcastService.setVendorServer(server);
    this.logger.log('Vendor WebSocket Gateway initialized');
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

    // Must be a vendor user
    if (!this.wsAuthService.isVendorUser(socket)) {
      this.logger.debug(`Non-vendor user attempted to connect: ${socket.data.userId}`);
      socket.emit('error', {
        code: WsErrorCode.FORBIDDEN,
        message: 'Vendor access required',
      } as WsErrorResponse);
      socket.disconnect(true);
      return;
    }

    // Auto-join vendor room
    socket.join(ROOM_NAMES.vendor(socket.data.vendorId!));

    // Auto-join user room for personal notifications
    socket.join(ROOM_NAMES.user(socket.data.userId));

    this.logger.log(
      `Vendor user ${socket.data.userId} connected to vendor ${socket.data.vendorId} (socket: ${socket.id})`,
    );

    // Send initial stats
    const stats = await this.getVendorStats(socket.data.vendorId!);
    socket.emit('vendor:stats', stats);

    socket.emit('connected', {
      userId: socket.data.userId,
      vendorId: socket.data.vendorId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.data?.userId) {
      this.logger.log(`Vendor user ${socket.data.userId} disconnected (socket: ${socket.id})`);
    }
  }

  /**
   * Join another vendor's room (for multi-vendor users or admins).
   */
  @SubscribeMessage('join:vendor')
  async handleJoinVendor(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: JoinVendorDto,
  ): Promise<WsSuccessResponse | WsErrorResponse> {
    // Verify user has access to this vendor
    const hasAccess = await this.verifyVendorAccess(socket.data.userId, data.vendorId);

    if (!hasAccess) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Vendor access denied' };
    }

    socket.join(ROOM_NAMES.vendor(data.vendorId));
    this.logger.debug(`User ${socket.data.userId} joined vendor room: ${data.vendorId}`);

    return { success: true };
  }

  /**
   * Leave a vendor room.
   */
  @SubscribeMessage('leave:vendor')
  handleLeaveVendor(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: LeaveVendorDto,
  ): WsSuccessResponse {
    socket.leave(ROOM_NAMES.vendor(data.vendorId));
    this.logger.debug(`User ${socket.data.userId} left vendor room: ${data.vendorId}`);
    return { success: true };
  }

  /**
   * Send a message in an interaction.
   */
  @SubscribeMessage('interaction:message')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ): Promise<WsSuccessResponse<{ messageId: string }> | WsErrorResponse> {
    // Verify user is a participant
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        id: data.interactionId,
        partnerId: socket.data.partnerId,
        vendorId: socket.data.vendorId,
      },
      select: { id: true, contactName: true },
    });

    if (!interaction) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Interaction not found or access denied' };
    }

    // Save message
    const message = await this.prisma.interactionMessage.create({
      data: {
        interactionId: data.interactionId,
        senderId: socket.data.userId,
        senderType: 'vendor',
        senderName: socket.data.email || 'Vendor',
        message: data.message,
      },
    });

    // Broadcast to interaction room
    this.broadcastService.broadcastToInteraction(data.interactionId, 'interaction:message', {
      interactionId: data.interactionId,
      message: {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        senderName: message.senderName,
        message: message.message,
        createdAt: message.createdAt,
      },
    });

    this.logger.debug(
      `User ${socket.data.userId} sent message in interaction ${data.interactionId}`,
    );

    return { success: true, data: { messageId: message.id } };
  }

  /**
   * Send typing indicator.
   */
  @SubscribeMessage('interaction:typing')
  handleTyping(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: TypingDto,
  ): WsSuccessResponse {
    // Broadcast to interaction room (except sender)
    socket.to(ROOM_NAMES.interaction(data.interactionId)).emit('interaction:typing', {
      interactionId: data.interactionId,
      userId: socket.data.userId,
    });

    return { success: true };
  }

  /**
   * Mark messages as read.
   * Note: Since InteractionMessage doesn't have readAt, we just broadcast the read event
   * for real-time typing indicators. Read tracking should be handled via API if needed.
   */
  @SubscribeMessage('interaction:read')
  async handleMarkRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: MarkReadDto,
  ): Promise<WsSuccessResponse> {
    // Broadcast to interaction room for real-time read receipts
    this.broadcastService.broadcastToInteraction(data.interactionId, 'interaction:read', {
      interactionId: data.interactionId,
      messageIds: data.messageIds,
      readBy: socket.data.userId,
    });

    return { success: true };
  }

  /**
   * Get vendor stats refresh.
   */
  @SubscribeMessage('vendor:get-stats')
  async handleGetStats(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ): Promise<WsSuccessResponse<unknown>> {
    if (!socket.data.vendorId) {
      return { success: true, data: null };
    }

    const stats = await this.getVendorStats(socket.data.vendorId);
    return { success: true, data: stats };
  }

  /**
   * Ping handler for keep-alive.
   */
  @SubscribeMessage('ping')
  handlePing(): { pong: number } {
    return { pong: Date.now() };
  }

  private async verifyVendorAccess(userId: string, vendorId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        vendorId: vendorId,
      },
    });
    return !!user;
  }

  private async getVendorStats(vendorId: string): Promise<{
    activeListings: number;
    newLeads: number;
    totalMessages: number;
  }> {
    const [activeListings, newLeads, totalMessages] = await Promise.all([
      this.prisma.listing.count({
        where: { vendorId, status: 'PUBLISHED' },
      }),
      this.prisma.interaction.count({
        where: { vendorId, status: 'NEW' },
      }),
      this.prisma.interactionMessage.count({
        where: {
          interaction: { vendorId },
        },
      }),
    ]);

    return { activeListings, newLeads, totalMessages };
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
