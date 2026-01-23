# FRONTEND (WEB) — PART 22 — WEBSOCKET & REAL-TIME INTEGRATION (LOCKED)

This part defines the **WebSocket integration strategy** for real-time features.
Must align with Backend Part 33 WebSocket specifications.

All rules from WEB PART 0–21 apply fully.

---

## 22.1 WEBSOCKET OVERVIEW

### Backend Alignment
This frontend spec aligns with **Backend Part 33** which defines:
- Socket.IO server with Redis adapter
- 5 namespaces: `/`, `/tenant`, `/vendor`, `/platform`, `/notifications`
- Room-based message routing
- 30+ event types

### Technology
- **Socket.IO Client** (must match server version)
- **React Context** for socket state
- **TanStack Query** invalidation on events

---

## 22.2 NAMESPACE → PORTAL MAPPING

| Portal | Namespace | Auto-Join Rooms |
|--------|-----------|-----------------|
| Platform Admin | `/platform` | `platform:admins` |
| Tenant Admin | `/tenant` | `tenant:{tenantId}` |
| Vendor Portal | `/vendor` | `vendor:{vendorId}`, `tenant:{tenantId}` |
| All Authenticated | `/notifications` | `user:{userId}` |

Rules:
- Connect to namespace based on active portal
- Always connect to `/notifications` namespace for personal alerts
- Disconnect on portal switch or logout

---

## 22.3 SOCKET PROVIDER

```typescript
// providers/socket-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useTenantContext } from '@/modules/tenant/hooks/use-tenant-context';

interface SocketState {
  socket: Socket | null;
  notificationSocket: Socket | null;
  isConnected: boolean;
  connectionError: Error | null;
}

interface SocketContextValue extends SocketState {
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SocketState>({
    socket: null,
    notificationSocket: null,
    isConnected: false,
    connectionError: null,
  });
  
  const { accessToken, user } = useAuth();
  const { currentTenant, currentVendor, activePortal } = useTenantContext();
  
  // Determine namespace based on portal
  const namespace = getNamespaceForPortal(activePortal);
  
  useEffect(() => {
    if (!accessToken || !user) return;
    
    // Main namespace connection
    const mainSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}${namespace}`, {
      auth: { token: accessToken },
      query: {
        tenant: currentTenant?.id,
        vendor: currentVendor?.id,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    // Notification namespace (always connected)
    const notifSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
    });
    
    // Event handlers
    mainSocket.on('connect', () => {
      setState(s => ({ ...s, isConnected: true, connectionError: null }));
    });
    
    mainSocket.on('disconnect', () => {
      setState(s => ({ ...s, isConnected: false }));
    });
    
    mainSocket.on('connect_error', (error) => {
      setState(s => ({ ...s, connectionError: error, isConnected: false }));
    });
    
    mainSocket.on('error', (error) => {
      if (error.code === 'UNAUTHORIZED' || error.code === 'TOKEN_EXPIRED') {
        // Trigger token refresh
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      }
    });
    
    setState(s => ({ ...s, socket: mainSocket, notificationSocket: notifSocket }));
    
    return () => {
      mainSocket.disconnect();
      notifSocket.disconnect();
    };
  }, [accessToken, user?.id, currentTenant?.id, currentVendor?.id, namespace]);
  
  const joinRoom = useCallback((room: string) => {
    const [roomType, roomId] = room.split(':');
    state.socket?.emit(`join:${roomType}`, { id: roomId });
  }, [state.socket]);
  
  const leaveRoom = useCallback((room: string) => {
    const [roomType, roomId] = room.split(':');
    state.socket?.emit(`leave:${roomType}`, { id: roomId });
  }, [state.socket]);
  
  return (
    <SocketContext.Provider value={{ ...state, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

function getNamespaceForPortal(portal: string): string {
  switch (portal) {
    case 'platform': return '/platform';
    case 'tenant': return '/tenant';
    case 'vendor': return '/vendor';
    default: return '/';
  }
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
```

---

## 22.4 EVENT SUBSCRIPTION HOOKS

### Generic Event Hook

```typescript
// hooks/use-socket-event.ts
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = [],
) {
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, ...deps]);
}
```

### Room Subscription Hook

```typescript
// hooks/use-socket-room.ts
export function useSocketRoom(room: string | null) {
  const { joinRoom, leaveRoom, isConnected } = useSocket();
  const [joined, setJoined] = useState(false);
  
  useEffect(() => {
    if (!room || !isConnected) return;
    
    joinRoom(room);
    setJoined(true);
    
    return () => {
      leaveRoom(room);
      setJoined(false);
    };
  }, [room, isConnected, joinRoom, leaveRoom]);
  
  return { joined };
}
```

### Notification Hook

```typescript
// hooks/use-realtime-notifications.ts
export function useRealtimeNotifications() {
  const { notificationSocket } = useSocket();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!notificationSocket) return;
    
    const handleNewNotification = (notification: Notification) => {
      // Update cache
      queryClient.setQueryData<Notification[]>(
        ['notifications'],
        (old) => [notification, ...(old || [])],
      );
      
      // Update count
      setUnreadCount(c => c + 1);
      
      // Show toast based on type
      showNotificationToast(notification, toast);
    };
    
    const handleCountUpdate = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    };
    
    notificationSocket.on('notification:new', handleNewNotification);
    notificationSocket.on('notification:count', handleCountUpdate);
    
    return () => {
      notificationSocket.off('notification:new', handleNewNotification);
      notificationSocket.off('notification:count', handleCountUpdate);
    };
  }, [notificationSocket, queryClient, toast]);
  
  return { unreadCount };
}
```

---

## 22.5 EVENT → QUERY INVALIDATION MAPPING

When WebSocket events arrive, invalidate corresponding TanStack Query caches:

| WebSocket Event | Query Keys to Invalidate |
|-----------------|-------------------------|
| `listing:created` | `['listings']`, `['dashboard', 'stats']` |
| `listing:updated` | `['listing', listingId]`, `['listings']` |
| `listing:published` | `['listing', listingId]`, `['listings', 'published']` |
| `listing:unpublished` | `['listing', listingId]`, `['listings', 'published']` |
| `listing:deleted` | `['listings']` |
| `interaction:new` | `['interactions']`, `['dashboard', 'stats']` |
| `interaction:updated` | `['interaction', interactionId]` |
| `interaction:message` | `['interaction', interactionId, 'messages']` |
| `vendor:approved` | `['vendor', vendorId]`, `['vendors']` |
| `vendor:suspended` | `['vendor', vendorId]` |
| `review:created` | `['reviews']`, `['vendor', vendorId, 'reviews']` |
| `subscription:changed` | `['subscription']`, `['entitlements']` |
| `notification:new` | `['notifications']` |

### Implementation

```typescript
// hooks/use-realtime-sync.ts
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  
  // Listing events
  useSocketEvent('listing:created', () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  });
  
  useSocketEvent<{ listingId: string }>('listing:updated', (data) => {
    queryClient.invalidateQueries({ queryKey: ['listing', data.listingId] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  });
  
  useSocketEvent<{ listingId: string }>('listing:published', (data) => {
    queryClient.invalidateQueries({ queryKey: ['listing', data.listingId] });
    queryClient.invalidateQueries({ queryKey: ['listings', { status: 'PUBLISHED' }] });
  });
  
  useSocketEvent<{ listingId: string }>('listing:unpublished', (data) => {
    queryClient.invalidateQueries({ queryKey: ['listing', data.listingId] });
    queryClient.invalidateQueries({ queryKey: ['listings', { status: 'PUBLISHED' }] });
  });
  
  // Interaction events
  useSocketEvent('interaction:new', (data) => {
    queryClient.invalidateQueries({ queryKey: ['interactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  });
  
  useSocketEvent<{ interactionId: string }>('interaction:message', (data) => {
    queryClient.invalidateQueries({ 
      queryKey: ['interaction', data.interactionId, 'messages'] 
    });
  });
  
  // Subscription events
  useSocketEvent('subscription:changed', () => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['entitlements'] });
    queryClient.invalidateQueries({ queryKey: ['usage'] });
  });
}
```

---

## 22.6 REAL-TIME FEATURES

### 22.6.1 Live Listing Viewers

```typescript
// components/listing-viewers.tsx
function ListingViewers({ listingId }: { listingId: string }) {
  const [viewerCount, setViewerCount] = useState(0);
  
  // Join listing room
  useSocketRoom(`listing:${listingId}`);
  
  // Track viewer count
  useSocketEvent<{ listingId: string; count: number }>(
    'listing:viewers',
    (data) => {
      if (data.listingId === listingId) {
        setViewerCount(data.count);
      }
    },
    [listingId],
  );
  
  if (viewerCount <= 1) return null;
  
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-sm">
      <Eye className="h-4 w-4" />
      <span>{viewerCount} viewing</span>
    </div>
  );
}
```

### 22.6.2 Interaction Chat

```typescript
// components/interaction-chat.tsx
function InteractionChat({ interactionId }: { interactionId: string }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Join interaction room
  useSocketRoom(`interaction:${interactionId}`);
  
  // Handle incoming messages
  useSocketEvent<{ interactionId: string; message: Message }>(
    'interaction:message',
    (data) => {
      if (data.interactionId === interactionId) {
        setMessages(m => [...m, data.message]);
      }
    },
    [interactionId],
  );
  
  // Handle typing indicators
  useSocketEvent<{ interactionId: string; userId: string }>(
    'interaction:typing',
    (data) => {
      if (data.interactionId === interactionId) {
        setTypingUsers(users => {
          if (!users.includes(data.userId)) {
            return [...users, data.userId];
          }
          return users;
        });
        
        // Clear after 3 seconds
        setTimeout(() => {
          setTypingUsers(users => users.filter(u => u !== data.userId));
        }, 3000);
      }
    },
    [interactionId],
  );
  
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
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      {typingUsers.length > 0 && (
        <TypingIndicator userIds={typingUsers} />
      )}
      <MessageInput 
        onSend={sendMessage} 
        onChange={handleTyping}
      />
    </div>
  );
}
```

### 22.6.3 Presence Indicators

```typescript
// hooks/use-presence.ts
export function usePresence(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  useSocketEvent<{ userId: string }>('presence:online', (data) => {
    if (userIds.includes(data.userId)) {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    }
  });
  
  useSocketEvent<{ userId: string }>('presence:offline', (data) => {
    setOnlineUsers(prev => {
      const next = new Set(prev);
      next.delete(data.userId);
      return next;
    });
  });
  
  return {
    isOnline: (userId: string) => onlineUsers.has(userId),
    onlineCount: onlineUsers.size,
  };
}

// Usage
function UserAvatar({ userId, name }: { userId: string; name: string }) {
  const { isOnline } = usePresence([userId]);
  
  return (
    <div className="relative">
      <Avatar>{name[0]}</Avatar>
      {isOnline(userId) && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
      )}
    </div>
  );
}
```

---

## 22.7 CONNECTION STATUS UI

```typescript
// components/connection-status.tsx
function ConnectionStatus() {
  const { isConnected, connectionError } = useSocket();
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Show banner after 2 seconds of disconnection
    let timeout: NodeJS.Timeout;
    if (!isConnected) {
      timeout = setTimeout(() => setShowBanner(true), 2000);
    } else {
      setShowBanner(false);
    }
    return () => clearTimeout(timeout);
  }, [isConnected]);
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Alert variant="warning" className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          {connectionError 
            ? 'Connection lost. Reconnecting...' 
            : 'Connecting to real-time updates...'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

---

## 22.8 PROVIDER INTEGRATION

```typescript
// app/(tenant)/layout.tsx
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantGuard>
      <SocketProvider>
        <RealtimeSyncProvider>
          <ConnectionStatus />
          {children}
        </RealtimeSyncProvider>
      </SocketProvider>
    </TenantGuard>
  );
}

// components/realtime-sync-provider.tsx
function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize all realtime sync hooks
  useRealtimeSync();
  useRealtimeNotifications();
  
  return <>{children}</>;
}
```

---

## 22.9 OPTIMISTIC UPDATES WITH ROLLBACK

```typescript
// hooks/use-optimistic-mutation.ts
export function useOptimisticInteractionStatus(interactionId: string) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  
  return useMutation({
    mutationFn: (newStatus: InteractionStatus) => 
      api.interactions.updateStatus(interactionId, newStatus),
    
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['interaction', interactionId] 
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData<Interaction>(
        ['interaction', interactionId]
      );
      
      // Optimistically update
      queryClient.setQueryData<Interaction>(
        ['interaction', interactionId],
        (old) => old ? { ...old, status: newStatus } : old,
      );
      
      return { previous };
    },
    
    onError: (err, newStatus, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          ['interaction', interactionId],
          context.previous,
        );
      }
    },
    
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['interaction', interactionId] 
      });
    },
  });
}
```

---

## 22.10 TESTING WEBSOCKET INTEGRATION

```typescript
// __tests__/socket-integration.test.tsx
import { renderHook, act } from '@testing-library/react';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

describe('WebSocket Integration', () => {
  let server: Server;
  
  beforeAll((done) => {
    server = new Server(3001);
    server.on('connection', () => done());
  });
  
  afterAll(() => {
    server.close();
  });
  
  it('should receive listing updates', async () => {
    const { result } = renderHook(() => useSocketEvent('listing:updated', vi.fn()));
    
    // Emit from server
    server.emit('listing:updated', { listingId: 'test-123' });
    
    // Verify handler called
    await waitFor(() => {
      expect(result.current).toHaveBeenCalledWith({ listingId: 'test-123' });
    });
  });
  
  it('should invalidate queries on events', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    
    renderHook(() => useRealtimeSync(), {
      wrapper: createWrapper(queryClient),
    });
    
    server.emit('listing:created', {});
    
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings'] });
    });
  });
});
```

---

## 22.11 FORBIDDEN PRACTICES

You must not:
- Connect to WebSocket without authentication
- Join rooms without permission verification
- Skip connection error handling
- Forget to unsubscribe on unmount
- Use polling when WebSocket is available
- Store sensitive data in socket state
- Block UI while waiting for WebSocket connection

---

## 22.12 EXECUTION DIRECTIVE

All real-time features must:
- Connect to correct namespace per portal
- Auto-join appropriate rooms
- Handle connection state gracefully
- Invalidate queries on relevant events
- Show connection status to users
- Clean up subscriptions on unmount
- Support graceful degradation to polling

Real-time enhances UX, not replaces API.

END OF WEB PART 22.
