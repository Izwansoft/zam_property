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
  ROOM_LIMITS,
  WsErrorCode,
  WsErrorResponse,
  WsSuccessResponse,
} from '../types';
import {
  JoinListingDto,
  LeaveListingDto,
  JoinInteractionDto,
  LeaveInteractionDto,
  ListingViewDto,
} from '../dto';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

/**
 * Partner namespace gateway.
 *
 * Per Part 33.2 - handles partner-scoped events:
 * - Listing updates (created, published, updated, deleted)
 * - Interaction events (new leads, messages)
 * - Room management for listings and interactions
 *
 * Authentication: Required (partner member)
 */
@WebSocketGateway({
  namespace: '/partner',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PartnerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PartnerGateway.name);

  constructor(
    private readonly wsAuthService: WsAuthService,
    private readonly broadcastService: BroadcastService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server): void {
    this.broadcastService.setTenantServer(server);
    this.logger.log('Partner WebSocket Gateway initialized');
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

    // Auto-join partner room
    socket.join(ROOM_NAMES.partner(socket.data.partnerId));

    // Auto-join user room for personal notifications
    socket.join(ROOM_NAMES.user(socket.data.userId));

    // If user is a vendor, auto-join vendor room
    if (socket.data.vendorId) {
      socket.join(ROOM_NAMES.vendor(socket.data.vendorId));
    }

    // If user is admin, auto-join partner listings room
    if (this.wsAuthService.isTenantAdmin(socket)) {
      socket.join(ROOM_NAMES.partnerListings(socket.data.partnerId));
    }

    this.logger.log(
      `User ${socket.data.userId} connected to partner ${socket.data.partnerId} (socket: ${socket.id})`,
    );

    socket.emit('connected', {
      userId: socket.data.userId,
      partnerId: socket.data.partnerId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.data?.userId) {
      this.logger.log(`User ${socket.data.userId} disconnected (socket: ${socket.id})`);
    }
  }

  /**
   * Join a listing room to receive updates.
   */
  @SubscribeMessage('join:listing')
  async handleJoinListing(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: JoinListingDto,
  ): Promise<WsSuccessResponse | WsErrorResponse> {
    // Verify listing exists and belongs to partner
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: data.listingId,
        partnerId: socket.data.partnerId,
      },
      select: { id: true, status: true },
    });

    if (!listing) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Listing not found or access denied' };
    }

    // Check room capacity
    const room = ROOM_NAMES.listing(data.listingId);
    const roomSize = await this.broadcastService.getRoomSize(this.server, room);

    if (roomSize >= ROOM_LIMITS.listing) {
      return { code: WsErrorCode.ROOM_FULL, message: 'Listing room is at capacity' };
    }

    socket.join(room);
    this.logger.debug(`User ${socket.data.userId} joined listing room: ${room}`);

    // Broadcast updated viewer count
    this.server.to(room).emit('listing:viewers', {
      listingId: data.listingId,
      count: roomSize + 1,
    });

    return { success: true };
  }

  /**
   * Leave a listing room.
   */
  @SubscribeMessage('leave:listing')
  async handleLeaveListing(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: LeaveListingDto,
  ): Promise<WsSuccessResponse> {
    const room = ROOM_NAMES.listing(data.listingId);
    socket.leave(room);
    this.logger.debug(`User ${socket.data.userId} left listing room: ${room}`);

    // Broadcast updated viewer count
    const roomSize = await this.broadcastService.getRoomSize(this.server, room);
    this.server.to(room).emit('listing:viewers', {
      listingId: data.listingId,
      count: roomSize,
    });

    return { success: true };
  }

  /**
   * Track a listing view.
   */
  @SubscribeMessage('listing:view')
  async handleListingView(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: ListingViewDto,
  ): Promise<WsSuccessResponse | WsErrorResponse> {
    // Verify listing exists
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: data.listingId,
        partnerId: socket.data.partnerId,
      },
      select: { id: true },
    });

    if (!listing) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Listing not found' };
    }

    // Note: Actual view tracking should be handled via analytics service
    // This just confirms the view was registered
    this.logger.debug(`User ${socket.data.userId} viewed listing ${data.listingId}`);

    return { success: true };
  }

  /**
   * Join an interaction room for real-time chat.
   */
  @SubscribeMessage('join:interaction')
  async handleJoinInteraction(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: JoinInteractionDto,
  ): Promise<WsSuccessResponse | WsErrorResponse> {
    // Verify user is a participant in the interaction
    // Check if user is either the contact email owner or a vendor user
    const interaction = await this.prisma.interaction.findFirst({
      where: {
        id: data.interactionId,
        partnerId: socket.data.partnerId,
      },
    });

    if (!interaction) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Interaction not found' };
    }

    // Check if user is a vendor user for this interaction's vendor via UserVendor junction
    const vendorMembership = await this.prisma.userVendor.findUnique({
      where: {
        userId_vendorId: {
          userId: socket.data.userId!,
          vendorId: interaction.vendorId,
        },
      },
    });
    if (!vendorMembership) {
      return { code: WsErrorCode.FORBIDDEN, message: 'Access denied' };
    }

    // Check room capacity
    const room = ROOM_NAMES.interaction(data.interactionId);
    const roomSize = await this.broadcastService.getRoomSize(this.server, room);

    if (roomSize >= ROOM_LIMITS.interaction) {
      return { code: WsErrorCode.ROOM_FULL, message: 'Interaction room is at capacity' };
    }

    socket.join(room);
    this.logger.debug(`User ${socket.data.userId} joined interaction room: ${room}`);

    return { success: true };
  }

  /**
   * Leave an interaction room.
   */
  @SubscribeMessage('leave:interaction')
  handleLeaveInteraction(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: LeaveInteractionDto,
  ): WsSuccessResponse {
    const room = ROOM_NAMES.interaction(data.interactionId);
    socket.leave(room);
    this.logger.debug(`User ${socket.data.userId} left interaction room: ${room}`);
    return { success: true };
  }

  /**
   * Ping handler for keep-alive.
   */
  @SubscribeMessage('ping')
  handlePing(): { pong: number } {
    return { pong: Date.now() };
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
      case WsErrorCode.ROOM_FULL:
        return 'Room is at capacity';
      case WsErrorCode.INVALID_PAYLOAD:
        return 'Invalid message payload';
      case WsErrorCode.RATE_LIMITED:
        return 'Rate limit exceeded';
      default:
        return 'Connection error';
    }
  }
}
