# PART 33 — WEBSOCKET STRATEGY & REAL-TIME COMMUNICATION (LOCKED)

This part defines the **WebSocket architecture, real-time communication patterns, and live update strategies**.
All real-time features must conform exactly to these specifications.

All rules from PART 0–32 apply.

---

## 33.1 WEBSOCKET ARCHITECTURE OVERVIEW

### Technology Stack
- **Socket.IO** for WebSocket with fallback (recommended)
- **Redis Adapter** for horizontal scaling
- **Rooms** for topic-based messaging
- **Namespaces** for logical separation

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  (Web Dashboard, Mobile App, Admin Portal)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                             │
│              (Sticky Sessions Enabled)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket Servers                          │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐                  │
│     │ Server 1│  │ Server 2│  │ Server 3│                  │
│     └────┬────┘  └────┬────┘  └────┬────┘                  │
│          │            │            │                        │
│          └────────────┼────────────┘                        │
│                       ▼                                      │
│              ┌─────────────────┐                            │
│              │  Redis Adapter  │                            │
│              │  (Pub/Sub)      │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 33.2 NAMESPACE STRUCTURE

### Namespace Definitions

| Namespace | Purpose | Auth Required |
|-----------|---------|---------------|
| `/` | Default/public (limited) | No |
| `/tenant` | Tenant-scoped events | Yes (tenant member) |
| `/vendor` | Vendor-specific events | Yes (vendor user) |
| `/platform` | Platform admin events | Yes (platform admin) |
| `/notifications` | User notifications | Yes (authenticated) |

### Connection URL Pattern
```
wss://api.example.com/socket.io/?tenant={tenantId}&token={jwt}
```

---

## 33.3 ROOM STRUCTURE

### Room Naming Convention
```
{scope}:{entity_type}:{entity_id}
```

### Room Types

| Room Pattern | Description | Who Joins |
|--------------|-------------|-----------|
| `tenant:{tenantId}` | All tenant events | Tenant members |
| `tenant:{tenantId}:listings` | Listing updates | Tenant admins, vendors |
| `vendor:{vendorId}` | Vendor-specific events | Vendor users |
| `listing:{listingId}` | Single listing updates | Viewers, owner |
| `user:{userId}` | Personal notifications | Single user |
| `interaction:{interactionId}` | Chat/interaction | Participants |

### Room Join Example
```typescript
// Server-side room management
socket.on('join:listing', async (listingId: string) => {
  // Verify permission
  const canAccess = await this.listingService.canAccess(
    socket.data.userId,
    listingId,
  );
  
  if (canAccess) {
    socket.join(`listing:${listingId}`);
    socket.emit('joined', { room: `listing:${listingId}` });
  } else {
    socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot access listing' });
  }
});
```

---

## 33.4 EVENT CATALOG (WEBSOCKET)

### 33.4.1 Listing Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `listing:created` | Server → Client | `{ listingId, title, vendorId }` | New listing created |
| `listing:updated` | Server → Client | `{ listingId, changes }` | Listing modified |
| `listing:published` | Server → Client | `{ listingId, publishedAt }` | Listing went live |
| `listing:unpublished` | Server → Client | `{ listingId }` | Listing taken down |
| `listing:deleted` | Server → Client | `{ listingId }` | Listing removed |
| `listing:view` | Client → Server | `{ listingId }` | Track listing view |

### 33.4.2 Interaction Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `interaction:new` | Server → Client | `{ interactionId, type, listingId }` | New lead/enquiry |
| `interaction:updated` | Server → Client | `{ interactionId, status }` | Status changed |
| `interaction:message` | Bidirectional | `{ interactionId, message, senderId }` | Chat message |
| `interaction:typing` | Client → Server | `{ interactionId }` | User is typing |
| `interaction:read` | Client → Server | `{ interactionId, messageIds }` | Messages read |

### 33.4.3 Notification Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `notification:new` | Server → Client | `{ notification }` | New notification |
| `notification:read` | Client → Server | `{ notificationId }` | Mark as read |
| `notification:count` | Server → Client | `{ unreadCount }` | Update badge count |

### 33.4.4 Presence Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `presence:online` | Server → Client | `{ userId, timestamp }` | User came online |
| `presence:offline` | Server → Client | `{ userId, timestamp }` | User went offline |
| `presence:activity` | Server → Client | `{ userId, activity }` | User activity update |

### 33.4.5 System Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `system:maintenance` | Server → Client | `{ message, scheduledAt }` | Maintenance notice |
| `system:reconnect` | Server → Client | `{ reason }` | Request reconnection |
| `error` | Server → Client | `{ code, message }` | Error occurred |

---

## 33.5 SERVER IMPLEMENTATION

### Gateway Setup (NestJS)

```typescript
// websocket/websocket.gateway.ts
@WebSocketGateway({
  namespace: '/tenant',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class TenantGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      // Authenticate
      const token = socket.handshake.auth.token;
      const user = await this.authService.validateToken(token);
      
      if (!user) {
        socket.emit('error', { code: 'UNAUTHORIZED' });
        socket.disconnect();
        return;
      }
      
      // Store user data on socket
      socket.data.userId = user.id;
      socket.data.tenantId = socket.handshake.query.tenant as string;
      
      // Verify tenant membership
      const membership = await this.tenantService.getMembership(
        user.id,
        socket.data.tenantId,
      );
      
      if (!membership) {
        socket.emit('error', { code: 'TENANT_ACCESS_DENIED' });
        socket.disconnect();
        return;
      }
      
      socket.data.roles = membership.roles;
      
      // Auto-join tenant room
      socket.join(`tenant:${socket.data.tenantId}`);
      
      // Auto-join user room for notifications
      socket.join(`user:${user.id}`);
      
      this.logger.log(`User ${user.id} connected to tenant ${socket.data.tenantId}`);
    } catch (error) {
      socket.emit('error', { code: 'CONNECTION_ERROR' });
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`User ${socket.data.userId} disconnected`);
  }

  @SubscribeMessage('join:listing')
  async handleJoinListing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { listingId: string },
  ) {
    // Permission check
    const listing = await this.listingService.findOne(data.listingId);
    
    if (listing?.tenantId !== socket.data.tenantId) {
      return { error: 'FORBIDDEN' };
    }
    
    socket.join(`listing:${data.listingId}`);
    return { success: true };
  }

  @SubscribeMessage('leave:listing')
  handleLeaveListing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { listingId: string },
  ) {
    socket.leave(`listing:${data.listingId}`);
    return { success: true };
  }
}
```

### Event Broadcasting Service

```typescript
// websocket/broadcast.service.ts
@Injectable()
export class BroadcastService {
  constructor(
    @Inject('TENANT_GATEWAY') private tenantGateway: TenantGateway,
    @Inject('NOTIFICATION_GATEWAY') private notificationGateway: NotificationGateway,
  ) {}

  // Broadcast to all tenant members
  broadcastToTenant(tenantId: string, event: string, payload: unknown) {
    this.tenantGateway.server
      .to(`tenant:${tenantId}`)
      .emit(event, payload);
  }

  // Broadcast to specific vendor
  broadcastToVendor(vendorId: string, event: string, payload: unknown) {
    this.tenantGateway.server
      .to(`vendor:${vendorId}`)
      .emit(event, payload);
  }

  // Broadcast to listing viewers
  broadcastToListing(listingId: string, event: string, payload: unknown) {
    this.tenantGateway.server
      .to(`listing:${listingId}`)
      .emit(event, payload);
  }

  // Send to specific user
  sendToUser(userId: string, event: string, payload: unknown) {
    this.notificationGateway.server
      .to(`user:${userId}`)
      .emit(event, payload);
  }
}
```

### Integration with Domain Events

```typescript
// websocket/event-bridge.service.ts
@Injectable()
export class WebSocketEventBridge {
  constructor(private broadcastService: BroadcastService) {}

  @OnEvent('listing.published')
  handleListingPublished(event: ListingPublishedEvent) {
    // Notify tenant members
    this.broadcastService.broadcastToTenant(
      event.tenantId,
      'listing:published',
      {
        listingId: event.listingId,
        title: event.title,
        publishedAt: event.publishedAt,
      },
    );

    // Notify listing watchers
    this.broadcastService.broadcastToListing(
      event.listingId,
      'listing:updated',
      { status: 'PUBLISHED' },
    );
  }

  @OnEvent('interaction.created')
  handleInteractionCreated(event: InteractionCreatedEvent) {
    // Notify vendor
    this.broadcastService.broadcastToVendor(
      event.vendorId,
      'interaction:new',
      {
        interactionId: event.interactionId,
        type: event.interactionType,
        listingId: event.listingId,
        contactName: event.contactName,
      },
    );
  }

  @OnEvent('notification.created')
  handleNotificationCreated(event: NotificationCreatedEvent) {
    this.broadcastService.sendToUser(
      event.recipientId,
      'notification:new',
      event.notification,
    );
  }
}
```

---

## 33.6 CLIENT IMPLEMENTATION

### Socket Provider (React)

```typescript
// providers/socket-provider.tsx
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  
  const { accessToken, tenant } = useAuth();
  
  useEffect(() => {
    if (!accessToken || !tenant) return;
    
    const newSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}/tenant`, {
      auth: { token: accessToken },
      query: { tenant: tenant.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });
    
    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });
    
    newSocket.on('connect_error', (error) => {
      setConnectionError(error);
      setIsConnected(false);
    });
    
    newSocket.on('error', (error) => {
      if (error.code === 'UNAUTHORIZED') {
        // Token expired, trigger refresh
        refreshToken();
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, tenant?.id]);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
```

### Event Subscription Hook

```typescript
// hooks/useSocketEvent.ts
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = [],
) {
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on(event, handler);
    
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, ...deps]);
}

// Usage
function ListingUpdates({ listingId }: { listingId: string }) {
  const queryClient = useQueryClient();
  
  useSocketEvent<ListingUpdatedEvent>(
    'listing:updated',
    (data) => {
      if (data.listingId === listingId) {
        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      }
    },
    [listingId],
  );
  
  return null;
}
```

### Room Management Hook

```typescript
// hooks/useSocketRoom.ts
export function useSocketRoom(room: string) {
  const { socket } = useSocket();
  const [joined, setJoined] = useState(false);
  
  useEffect(() => {
    if (!socket || !room) return;
    
    socket.emit(`join:${room.split(':')[0]}`, { id: room.split(':')[1] }, (response) => {
      if (response.success) {
        setJoined(true);
      }
    });
    
    return () => {
      socket.emit(`leave:${room.split(':')[0]}`, { id: room.split(':')[1] });
      setJoined(false);
    };
  }, [socket, room]);
  
  return { joined };
}

// Usage
function ListingDetail({ listingId }: { listingId: string }) {
  const { joined } = useSocketRoom(`listing:${listingId}`);
  
  // Component will receive real-time updates when joined
  return <div>{/* listing content */}</div>;
}
```

### Notification Hook

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useSocketEvent<Notification>('notification:new', (notification) => {
    // Update cache
    queryClient.setQueryData<Notification[]>(
      ['notifications'],
      (old) => [notification, ...(old || [])],
    );
    
    // Update count
    setUnreadCount((c) => c + 1);
    
    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
    });
  });
  
  useSocketEvent<{ unreadCount: number }>('notification:count', (data) => {
    setUnreadCount(data.unreadCount);
  });
  
  const markAsRead = useCallback((notificationId: string) => {
    socket?.emit('notification:read', { notificationId });
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [socket]);
  
  return { unreadCount, markAsRead };
}
```

---

## 33.7 REAL-TIME FEATURES

### 33.7.1 Live Listing Views Counter

```typescript
// Server
@SubscribeMessage('listing:view')
async handleListingView(
  @ConnectedSocket() socket: Socket,
  @MessageBody() data: { listingId: string },
) {
  // Increment view count
  await this.analyticsService.trackView(data.listingId, socket.data.userId);
  
  // Get current viewer count
  const room = `listing:${data.listingId}`;
  const sockets = await this.server.in(room).fetchSockets();
  
  // Broadcast to all viewers
  this.server.to(room).emit('listing:viewers', {
    listingId: data.listingId,
    count: sockets.length,
  });
}

// Client
function ListingViewers({ listingId }: { listingId: string }) {
  const [viewerCount, setViewerCount] = useState(0);
  
  useSocketEvent('listing:viewers', (data) => {
    if (data.listingId === listingId) {
      setViewerCount(data.count);
    }
  });
  
  return (
    <span className="text-muted-foreground">
      {viewerCount} {viewerCount === 1 ? 'person' : 'people'} viewing
    </span>
  );
}
```

### 33.7.2 Real-Time Chat (Interactions)

```typescript
// Server
@SubscribeMessage('interaction:message')
async handleMessage(
  @ConnectedSocket() socket: Socket,
  @MessageBody() data: { interactionId: string; message: string },
) {
  // Verify participant
  const interaction = await this.interactionService.findOne(data.interactionId);
  const isParticipant = this.isParticipant(interaction, socket.data.userId);
  
  if (!isParticipant) {
    return { error: 'FORBIDDEN' };
  }
  
  // Save message
  const savedMessage = await this.messageService.create({
    interactionId: data.interactionId,
    senderId: socket.data.userId,
    content: data.message,
  });
  
  // Broadcast to room
  this.server.to(`interaction:${data.interactionId}`).emit('interaction:message', {
    interactionId: data.interactionId,
    message: savedMessage,
  });
  
  return { success: true, messageId: savedMessage.id };
}

@SubscribeMessage('interaction:typing')
handleTyping(
  @ConnectedSocket() socket: Socket,
  @MessageBody() data: { interactionId: string },
) {
  socket.to(`interaction:${data.interactionId}`).emit('interaction:typing', {
    interactionId: data.interactionId,
    userId: socket.data.userId,
  });
}

// Client
function Chat({ interactionId }: { interactionId: string }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  useSocketRoom(`interaction:${interactionId}`);
  
  useSocketEvent('interaction:message', (data) => {
    if (data.interactionId === interactionId) {
      setMessages((m) => [...m, data.message]);
    }
  });
  
  useSocketEvent('interaction:typing', (data) => {
    if (data.interactionId === interactionId) {
      setTypingUsers((users) => [...new Set([...users, data.userId])]);
      // Clear after 3 seconds
      setTimeout(() => {
        setTypingUsers((users) => users.filter((u) => u !== data.userId));
      }, 3000);
    }
  });
  
  const sendMessage = (content: string) => {
    socket?.emit('interaction:message', { interactionId, message: content });
  };
  
  const handleTyping = useMemo(
    () => throttle(() => {
      socket?.emit('interaction:typing', { interactionId });
    }, 2000),
    [socket, interactionId],
  );
  
  return (
    <div>
      <MessageList messages={messages} />
      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      <MessageInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
}
```

### 33.7.3 Dashboard Live Updates

```typescript
function Dashboard() {
  const queryClient = useQueryClient();
  
  // Live listing updates
  useSocketEvent('listing:created', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['listings', 'recent'] });
  });
  
  useSocketEvent('interaction:new', (data) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['interactions', 'recent'] });
    
    // Show notification
    toast({
      title: 'New Lead',
      description: `New enquiry for ${data.listingTitle}`,
    });
  });
  
  return <DashboardContent />;
}
```

---

## 33.8 CONNECTION MANAGEMENT

### Reconnection Strategy

```typescript
const socketConfig = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
};

// Exponential backoff: 1s, 1.5s, 2.25s, 3.375s, 5s
```

### Connection Status UI

```typescript
function ConnectionStatus() {
  const { isConnected, connectionError } = useSocket();
  
  if (isConnected) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md">
      {connectionError ? (
        <span>Connection error. Retrying...</span>
      ) : (
        <span>Reconnecting...</span>
      )}
    </div>
  );
}
```

### Heartbeat & Keep-Alive

```typescript
// Server-side ping/pong is handled by Socket.IO automatically
// Client can implement activity-based keep-alive

function useKeepAlive() {
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    const interval = setInterval(() => {
      socket.emit('ping');
    }, 25000); // Every 25 seconds
    
    return () => clearInterval(interval);
  }, [socket]);
}
```

---

## 33.9 SCALING & PERFORMANCE

### Redis Adapter Configuration

```typescript
// websocket/websocket.module.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@Module({
  providers: [
    {
      provide: 'SOCKET_IO_ADAPTER',
      useFactory: async () => {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();
        
        await Promise.all([pubClient.connect(), subClient.connect()]);
        
        return createAdapter(pubClient, subClient);
      },
    },
  ],
})
export class WebSocketModule {}
```

### Room Size Limits

```typescript
const ROOM_LIMITS = {
  listing: 1000,      // Max viewers per listing
  interaction: 10,    // Max participants per chat
  tenant: 10000,      // Max connections per tenant
};

@SubscribeMessage('join:listing')
async handleJoinListing(socket: Socket, data: { listingId: string }) {
  const room = `listing:${data.listingId}`;
  const sockets = await this.server.in(room).fetchSockets();
  
  if (sockets.length >= ROOM_LIMITS.listing) {
    return { error: 'ROOM_FULL' };
  }
  
  socket.join(room);
  return { success: true };
}
```

### Message Rate Limiting

```typescript
@UseGuards(WsThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 1000 } }) // 10 messages per second
@SubscribeMessage('interaction:message')
handleMessage(...) { }
```

---

## 33.10 SECURITY

### Authentication Refresh

```typescript
// Handle token expiration during connection
socket.on('error', (error) => {
  if (error.code === 'TOKEN_EXPIRED') {
    // Refresh token and reconnect
    const newToken = await refreshToken();
    socket.auth.token = newToken;
    socket.connect();
  }
});
```

### Input Validation

```typescript
@SubscribeMessage('interaction:message')
handleMessage(
  @ConnectedSocket() socket: Socket,
  @MessageBody(new ValidationPipe()) data: SendMessageDto,
) {
  // Data is validated by DTO
}

// DTOs
class SendMessageDto {
  @IsUUID()
  interactionId: string;
  
  @IsString()
  @MaxLength(5000)
  @IsNotEmpty()
  message: string;
}
```

### Permission Enforcement

```typescript
function requirePermission(permission: string) {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.permissions?.includes(permission)) {
      next(new Error('FORBIDDEN'));
    } else {
      next();
    }
  };
}
```

---

## 33.11 TESTING

### Unit Testing Gateway

```typescript
describe('TenantGateway', () => {
  let gateway: TenantGateway;
  let mockSocket: MockSocket;
  
  beforeEach(() => {
    mockSocket = createMockSocket({
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
  });
  
  it('should join listing room', async () => {
    const result = await gateway.handleJoinListing(mockSocket, { listingId: 'listing-1' });
    
    expect(result.success).toBe(true);
    expect(mockSocket.join).toHaveBeenCalledWith('listing:listing-1');
  });
});
```

### E2E Testing

```typescript
describe('WebSocket E2E', () => {
  let client: Socket;
  
  beforeAll(async () => {
    client = io('http://localhost:3000/tenant', {
      auth: { token: testToken },
      query: { tenant: testTenantId },
    });
    
    await new Promise((resolve) => client.on('connect', resolve));
  });
  
  afterAll(() => {
    client.disconnect();
  });
  
  it('should receive listing updates', (done) => {
    client.on('listing:updated', (data) => {
      expect(data.listingId).toBe(testListingId);
      done();
    });
    
    // Trigger update via API
    request(app).patch(`/listings/${testListingId}`).send({ title: 'New Title' });
  });
});
```

---

## 33.12 MONITORING

### Metrics to Track

| Metric | Description |
|--------|-------------|
| `ws.connections.active` | Current active connections |
| `ws.connections.total` | Total connections (cumulative) |
| `ws.messages.sent` | Messages sent per second |
| `ws.messages.received` | Messages received per second |
| `ws.rooms.count` | Number of active rooms |
| `ws.latency.p95` | Message delivery latency |

### Health Endpoint

```typescript
@Get('/health/websocket')
async getWebSocketHealth() {
  const sockets = await this.server.fetchSockets();
  
  return {
    status: 'healthy',
    connections: sockets.length,
    rooms: this.server.sockets.adapter.rooms.size,
  };
}
```

---

## 33.13 FORBIDDEN PRACTICES

You must not:
- Allow unauthenticated WebSocket connections to protected namespaces
- Broadcast sensitive data to unauthorized clients
- Skip permission checks on room joins
- Allow unlimited message rates
- Store sensitive data in socket.data without encryption
- Forget to clean up listeners on disconnect
- Use WebSockets for large data transfers (use REST + polling instead)

---

## 33.14 EXECUTION DIRECTIVE

All real-time features must:
- Authenticate and authorize all connections
- Use appropriate room scoping
- Handle reconnection gracefully
- Rate limit message sending
- Integrate with domain events
- Scale horizontally via Redis adapter
- Be testable and monitorable

Real-time is a feature, not a hack.

END OF PART 33.
