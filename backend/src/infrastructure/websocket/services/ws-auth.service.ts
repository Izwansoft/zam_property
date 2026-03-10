import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedSocket, WsErrorCode } from '../types';

/**
 * Payload extracted from JWT token for WebSocket.
 */
export interface WsJwtPayload {
  sub: string;
  partnerId: string;
  role: string;
  tokenType?: 'access' | 'refresh';
  permissions?: string[];
}

/**
 * Service for WebSocket authentication.
 * Validates JWT tokens and enriches socket with user data.
 *
 * Per Part 33.5 - all protected namespaces require authentication.
 */
@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Authenticate a WebSocket connection.
   * Extracts and validates JWT from socket handshake.
   *
   * @param socket - The socket connection to authenticate
   * @returns Error code if authentication fails, undefined if successful
   */
  async authenticate(socket: AuthenticatedSocket): Promise<WsErrorCode | undefined> {
    try {
      // Extract token from handshake auth or query
      const token = this.extractToken(socket);

      if (!token) {
        this.logger.debug('No token provided in WebSocket connection');
        return WsErrorCode.UNAUTHORIZED;
      }

      // Verify JWT token
      const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
      if (!secret) {
        this.logger.error('JWT_ACCESS_TOKEN_SECRET is not configured');
        return WsErrorCode.CONNECTION_ERROR;
      }

      let payload: WsJwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<WsJwtPayload>(token, { secret });
      } catch (error) {
        if ((error as Error).name === 'TokenExpiredError') {
          return WsErrorCode.TOKEN_EXPIRED;
        }
        this.logger.debug(`Invalid token: ${(error as Error).message}`);
        return WsErrorCode.UNAUTHORIZED;
      }

      // Ensure it's an access token, not refresh
      if (payload.tokenType === 'refresh') {
        this.logger.debug('Refresh token used for WebSocket connection');
        return WsErrorCode.UNAUTHORIZED;
      }

      // Extract partner from query or handshake
      const partnerId = this.extractpartnerId(socket, payload);

      if (!partnerId) {
        this.logger.debug('No partner ID provided in WebSocket connection');
        return WsErrorCode.TENANT_ACCESS_DENIED;
      }

      // Verify partner ID matches token's partner (cross-partner protection)
      if (payload.partnerId !== partnerId) {
        this.logger.warn(
          `Cross-partner WebSocket attempt: token=${payload.partnerId}, requested=${partnerId}`,
        );
        return WsErrorCode.TENANT_ACCESS_DENIED;
      }

      // Verify user exists and is active
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          partnerId: partnerId,
          status: 'ACTIVE',
        },
        include: {
          userVendors: {
            where: { isPrimary: true },
            select: { vendorId: true },
            take: 1,
          },
        },
      });

      if (!user) {
        this.logger.debug(`User not found or inactive: ${payload.sub}`);
        return WsErrorCode.UNAUTHORIZED;
      }

      // Enrich socket with user data
      socket.data = {
        userId: user.id,
        partnerId: partnerId,
        email: user.email,
        roles: [user.role],
        vendorId: user.userVendors[0]?.vendorId,
        permissions: payload.permissions ?? [],
      };

      this.logger.debug(`WebSocket authenticated: user=${user.id}, partner=${partnerId}`);
      return undefined; // Success
    } catch (error) {
      this.logger.error(`WebSocket authentication error: ${(error as Error).message}`);
      return WsErrorCode.CONNECTION_ERROR;
    }
  }

  /**
   * Extract JWT token from socket handshake.
   * Supports: auth.token, query.token, Authorization header
   */
  private extractToken(socket: AuthenticatedSocket): string | undefined {
    // Priority 1: auth object (Socket.IO native)
    const authToken = socket.handshake?.auth?.token as string | undefined;
    if (authToken) {
      return authToken;
    }

    // Priority 2: query parameter
    const queryToken = socket.handshake?.query?.token as string | undefined;
    if (queryToken) {
      return queryToken;
    }

    // Priority 3: Authorization header
    const authHeader = socket.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  /**
   * Extract partner ID from socket handshake.
   * Supports: query.partner, auth.partnerId
   */
  private extractpartnerId(socket: AuthenticatedSocket, payload: WsJwtPayload): string | undefined {
    // Priority 1: query parameter
    const queryTenant = socket.handshake?.query?.partner as string | undefined;
    if (queryTenant) {
      return queryTenant;
    }

    // Priority 2: auth object
    const authTenant = socket.handshake?.auth?.partnerId as string | undefined;
    if (authTenant) {
      return authTenant;
    }

    // Fallback: use partner from JWT payload
    return payload.partnerId;
  }

  /**
   * Check if user has a specific role.
   */
  hasRole(socket: AuthenticatedSocket, role: string): boolean {
    return socket.data?.roles?.includes(role) ?? false;
  }

  /**
   * Check if user has any of the specified roles.
   */
  hasAnyRole(socket: AuthenticatedSocket, roles: string[]): boolean {
    return roles.some((role) => this.hasRole(socket, role));
  }

  /**
   * Check if user is a platform admin.
   */
  isPlatformAdmin(socket: AuthenticatedSocket): boolean {
    return this.hasRole(socket, 'SUPER_ADMIN');
  }

  /**
   * Check if user is a partner admin.
   */
  isTenantAdmin(socket: AuthenticatedSocket): boolean {
    return this.hasAnyRole(socket, ['SUPER_ADMIN', 'PARTNER_ADMIN']);
  }

  /**
   * Check if user is a vendor user.
   */
  isVendorUser(socket: AuthenticatedSocket): boolean {
    return socket.data?.vendorId !== undefined;
  }
}
