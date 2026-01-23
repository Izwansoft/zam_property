import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';

/**
 * Redis-backed Socket.IO adapter for horizontal scaling.
 *
 * Per Part 33.9 - enables multiple WebSocket servers to share
 * state via Redis pub/sub for horizontal scaling.
 *
 * Features:
 * - Redis pub/sub for cross-server communication
 * - Graceful fallback to single-instance if Redis unavailable
 * - Connection pooling and retry logic
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;
  private pubClient: ReturnType<typeof createClient> | undefined;
  private subClient: ReturnType<typeof createClient> | undefined;
  private redisConnected = false;

  constructor(
    app: INestApplication,
    private readonly redisUrl?: string,
  ) {
    super(app);
  }

  /**
   * Initialize Redis clients for pub/sub.
   * Must be called before creating server instances.
   */
  async connectToRedis(): Promise<void> {
    if (!this.redisUrl) {
      this.logger.warn('SOCKET_IO_REDIS_URL not configured, running in single-instance mode');
      return;
    }

    try {
      this.pubClient = createClient({ url: this.redisUrl });
      this.subClient = this.pubClient.duplicate();

      // Setup error handlers
      this.pubClient.on('error', (err: Error) => {
        this.logger.error(`Redis pub client error: ${err.message}`);
      });

      this.subClient.on('error', (err: Error) => {
        this.logger.error(`Redis sub client error: ${err.message}`);
      });

      // Connect both clients
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
      this.redisConnected = true;

      this.logger.log('Socket.IO Redis adapter connected successfully');
    } catch (error) {
      this.logger.warn(
        `Failed to connect Socket.IO Redis adapter: ${(error as Error).message}. Running in single-instance mode.`,
      );
      this.redisConnected = false;
    }
  }

  /**
   * Create Socket.IO server with Redis adapter if available.
   */
  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    if (this.adapterConstructor && this.redisConnected) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Socket.IO server using Redis adapter');
    } else {
      this.logger.log('Socket.IO server using default in-memory adapter');
    }

    return server;
  }

  /**
   * Cleanup Redis connections on shutdown.
   */
  async cleanup(): Promise<void> {
    try {
      if (this.pubClient) {
        await this.pubClient.quit();
      }
      if (this.subClient) {
        await this.subClient.quit();
      }
      this.logger.log('Socket.IO Redis adapter disconnected');
    } catch (error) {
      this.logger.error(`Error closing Redis connections: ${(error as Error).message}`);
    }
  }

  /**
   * Check if Redis adapter is connected.
   */
  isRedisConnected(): boolean {
    return this.redisConnected;
  }
}
