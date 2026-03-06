import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ROOM_NAMES } from '../types';

/**
 * Injection tokens for gateway servers.
 */
export const TENANT_SERVER = 'TENANT_SERVER';
export const VENDOR_SERVER = 'VENDOR_SERVER';
export const NOTIFICATIONS_SERVER = 'NOTIFICATIONS_SERVER';
export const PLATFORM_SERVER = 'PLATFORM_SERVER';

/**
 * Service for broadcasting messages to WebSocket rooms.
 *
 * Per Part 33.5 - centralized broadcasting to maintain consistency
 * across all namespaces and horizontal scaling via Redis adapter.
 *
 * Usage:
 * - broadcastToTenant: All partner members
 * - broadcastToVendor: Specific vendor users
 * - broadcastToListing: Listing viewers
 * - sendToUser: Personal notifications
 */
@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  private partnerServer?: Server;
  private vendorServer?: Server;
  private notificationsServer?: Server;
  private platformServer?: Server;

  /**
   * Set the server instances from gateways.
   * Called by gateways after initialization.
   */
  setTenantServer(server: Server): void {
    this.partnerServer = server;
    this.logger.log('Partner server registered with BroadcastService');
  }

  setVendorServer(server: Server): void {
    this.vendorServer = server;
    this.logger.log('Vendor server registered with BroadcastService');
  }

  setNotificationsServer(server: Server): void {
    this.notificationsServer = server;
    this.logger.log('Notifications server registered with BroadcastService');
  }

  setPlatformServer(server: Server): void {
    this.platformServer = server;
    this.logger.log('Platform server registered with BroadcastService');
  }

  /**
   * Broadcast event to all members of a partner.
   */
  broadcastToTenant(partnerId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.partner(partnerId);

    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
      this.logger.debug(`Broadcast to partner room ${room}: ${event}`);
    }

    // Also broadcast to notifications namespace for cross-namespace events
    if (this.notificationsServer) {
      this.notificationsServer.to(room).emit(event, payload);
    }
  }

  /**
   * Broadcast event to partner's listing room.
   * Used for listing-related notifications to admins/vendors.
   */
  broadcastToTenantListings(partnerId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.partnerListings(partnerId);

    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
      this.logger.debug(`Broadcast to partner listings room ${room}: ${event}`);
    }
  }

  /**
   * Broadcast event to a specific vendor's room.
   */
  broadcastToVendor(vendorId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.vendor(vendorId);

    if (this.vendorServer) {
      this.vendorServer.to(room).emit(event, payload);
      this.logger.debug(`Broadcast to vendor room ${room}: ${event}`);
    }

    // Also broadcast to partner namespace where vendor users might be
    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
    }
  }

  /**
   * Broadcast event to viewers of a specific listing.
   */
  broadcastToListing(listingId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.listing(listingId);

    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
      this.logger.debug(`Broadcast to listing room ${room}: ${event}`);
    }
  }

  /**
   * Broadcast event to participants of an interaction.
   */
  broadcastToInteraction(interactionId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.interaction(interactionId);

    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
      this.logger.debug(`Broadcast to interaction room ${room}: ${event}`);
    }
  }

  /**
   * Send event to a specific user (notifications).
   */
  sendToUser(userId: string, event: string, payload: unknown): void {
    const room = ROOM_NAMES.user(userId);

    // Primary: notifications namespace
    if (this.notificationsServer) {
      this.notificationsServer.to(room).emit(event, payload);
      this.logger.debug(`Send to user room ${room}: ${event}`);
    }

    // Fallback: partner namespace
    if (this.partnerServer) {
      this.partnerServer.to(room).emit(event, payload);
    }
  }

  /**
   * Broadcast event to all platform admins.
   */
  broadcastToPlatform(event: string, payload: unknown): void {
    if (this.platformServer) {
      this.platformServer.emit(event, payload);
      this.logger.debug(`Broadcast to platform: ${event}`);
    }
  }

  /**
   * Get active connection count for a room.
   */
  async getRoomSize(server: Server, room: string): Promise<number> {
    try {
      const sockets = await server.in(room).fetchSockets();
      return sockets.length;
    } catch (error) {
      this.logger.error(`Error fetching room size for ${room}: ${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * Get active connection count for a listing.
   */
  async getListingViewerCount(listingId: string): Promise<number> {
    if (!this.partnerServer) return 0;
    return this.getRoomSize(this.partnerServer, ROOM_NAMES.listing(listingId));
  }

  /**
   * Get total connection count across all namespaces.
   */
  async getTotalConnections(): Promise<number> {
    let total = 0;

    if (this.partnerServer) {
      const sockets = await this.partnerServer.fetchSockets();
      total += sockets.length;
    }

    if (this.vendorServer) {
      const sockets = await this.vendorServer.fetchSockets();
      total += sockets.length;
    }

    if (this.notificationsServer) {
      const sockets = await this.notificationsServer.fetchSockets();
      total += sockets.length;
    }

    if (this.platformServer) {
      const sockets = await this.platformServer.fetchSockets();
      total += sockets.length;
    }

    return total;
  }
}
