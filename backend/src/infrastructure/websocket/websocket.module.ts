import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { WsAuthService } from './services/ws-auth.service';
import { BroadcastService } from './services/broadcast.service';
import { WebSocketEventBridge } from './services/websocket-event-bridge.service';

// Gateways
import { PartnerGateway } from './gateways/partner.gateway';
import { VendorGateway } from './gateways/vendor.gateway';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { PlatformGateway } from './gateways/platform.gateway';

// Database
import { DatabaseModule } from '../database/database.module';

/**
 * WebSocket module providing real-time communication infrastructure.
 *
 * Per Part 33 - provides:
 * - Multiple namespace gateways (/partner, /vendor, /notifications)
 * - JWT authentication for WebSocket connections
 * - Room-based messaging
 * - Redis adapter support for horizontal scaling
 * - Event bridge for domain → WebSocket communication
 *
 * This module is global so BroadcastService is available throughout the app.
 */
@Global()
@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_TTL', '15m'),
        },
      }),
    }),
  ],
  providers: [
    // Services
    WsAuthService,
    BroadcastService,
    WebSocketEventBridge,
    // Gateways
    PartnerGateway,
    VendorGateway,
    NotificationsGateway,
    PlatformGateway,
  ],
  exports: [BroadcastService, WsAuthService],
})
export class WebSocketModule {}
