# FRONTEND (WEB) — PART 4 — AUTH, SESSION, ROUTE GUARDS, ROLE PORTALS & TENANT CONTEXT (LOCKED)

This part defines how authentication, session management, role-based access,
and tenant context are enforced across the dashboard.

All rules from WEB PART 0–3 apply fully.

---

## 4.1 AUTH PRINCIPLES (WEB)

Rules:
- The backend is the source of truth for auth and permissions
- The frontend must not invent roles/permissions
- The frontend enforces access at:
  - portal layout guards
  - page guards
  - UI action guards
- Security is not “hide buttons”; it is enforce AND communicate.

---

## 4.2 AUTH MECHANISM (CONTRACT-DRIVEN)

We support auth based on backend contract:
- Cookie session OR Bearer token

Rules:
- Frontend must not assume token format
- Frontend must rely on a `/me` or session endpoint to hydrate identity
- Session hydration must be cached and deduped (TanStack Query)

---

## 4.3 IDENTITY MODEL (CANONICAL UI SHAPE)

The UI identity model must include:
- user_id
- display_name
- email (optional display)
- global roles (platform scope) if any
- tenant memberships:
  - tenant_id
  - role(s) within tenant
  - vendor_id (if vendor user)
- entitlements snapshot (optional cached view)

Rules:
- Identity must be treated as read-only
- Identity fetch must be the first gate for protected portals

---

## 4.4 ROUTE GROUP GUARDS (AUTHORITATIVE)

We implement guards at the portal layout level.

### (platform) guard
- Requires platform admin role (or equivalent)
- Allows selecting tenant context (for support operations) only if permitted

### (tenant) guard
- Requires tenant membership + tenant-admin role (or allowed admin role)
- Requires resolved active tenant context

### (vendor) guard
- Requires vendor role and vendor_id
- Tenant context resolves from vendor record

### (ops) guard (optional)
- Requires support/ops role with scoped permissions

Rules:
- Guard failures redirect to:
  - login if unauthenticated
  - forbidden page if authenticated but unauthorized
- No protected page may render without guard success

---

## 4.5 TENANT CONTEXT RESOLUTION (LOCKED)

Tenant context is resolved differently per portal:

### Platform portal
- Tenant context is optional
- If performing tenant-scoped actions, a tenant must be explicitly selected
- Tenant selection must be permissioned and auditable (via backend)

### Tenant portal
- Tenant context is mandatory
- Selected tenant must match membership in identity
- Tenant switcher allowed only if user belongs to multiple tenants and has permission

### Vendor portal
- Tenant context is derived from vendor association
- Vendor users cannot switch tenants

Rules:
- No API request may execute with an ambiguous tenant context
- Tenant context must not be stored as free-form user input

---

## 4.6 PORTAL SHELLS & NAVIGATION (TEMPLATE-ALIGNED)

Rules:
- Use the downloaded shadcn kit layout primitives
- Each portal has its own navigation tree
- Navigation items are filtered by permissions/entitlements
- Active portal must be visually obvious

No mixed portal navigation.

---

## 4.7 RBAC + ENTITLEMENTS UI ENFORCEMENT

Rules:
- RBAC determines *who can act*
- Entitlements determine *whether the feature is available under the plan*

Enforcement happens at:
- page level (route entry)
- component level (feature visibility)
- action level (mutation triggers)

Denied UI actions must show reason:
- “You do not have permission” (RBAC)
- “Your plan does not include this feature” (entitlement)

---

## 4.8 PERMISSION MODEL (FRONTEND)

Rules:
- Frontend treats permissions as strings from backend (e.g. `tenant.vendors.approve`)
- Frontend must provide helper utilities:
  - `hasRole(...)`
  - `hasPermission(...)`
  - `hasEntitlement(...)`
- These helpers must be pure and unit-tested
- UI must not hardcode permission logic in pages

Permissions are evaluated from identity/session payload.

---

## 4.9 AUTH UX REQUIREMENTS

Rules:
- Login page uses template styling
- Logout clears session and redirects to login
- Session expiry must:
  - redirect to login
  - preserve intended destination for post-login return
- Forbidden page must:
  - show reason and contact path (support)
  - avoid leaking sensitive details

---

## 4.10 SSR/CSR RULES FOR AUTH

Rules:
- Root layout bootstraps theme/providers only
- Portal layouts perform auth checks
- Pages assume identity is available from portal context
- Client components must never flash protected content before guard completes

No “auth flicker”.

---

## 4.11 SECURITY HARDENING (WEB)

Rules:
- Never store secrets in localStorage by default
- Avoid exposing raw tokens to client JS if cookie-based auth is available
- Prevent open redirects
- Sanitize user-visible server messages (no HTML injection)
- Use safe defaults for caching (no caching for sensitive responses)

---

## 4.12 FORBIDDEN PRACTICES

You must not:
- Bypass guards for faster dev
- Render portal pages before identity hydration
- Allow tenant switching in vendor portal
- Hide actions without enforcing guard checks
- Hardcode roles/permissions inconsistent with backend

---

## 4.13 SESSION TIMEOUT UX (AUTHORITATIVE)

Session timeout handling must be graceful and preserve user work.

### 4.13.1 Session Lifecycle States

| State | Description | UI Behavior |
|-------|-------------|-------------|
| `active` | Valid session, recent activity | Normal operation |
| `idle` | No activity for threshold period | Show idle warning |
| `expiring` | Session nearing expiration | Show countdown modal |
| `expired` | Session has expired | Redirect to login |
| `refreshing` | Token refresh in progress | Silent, no UI change |

### 4.13.2 Timeout Thresholds

```typescript
const SESSION_CONFIG = {
  // Idle detection
  idleThresholdMs: 15 * 60 * 1000,      // 15 minutes no activity
  idleWarningMs: 2 * 60 * 1000,          // Show warning 2 min before idle action
  
  // Token expiration
  tokenExpiryWarningMs: 5 * 60 * 1000,   // Show warning 5 min before expiry
  tokenRefreshThresholdMs: 10 * 60 * 1000, // Refresh when 10 min remaining
  
  // Activity tracking
  activityEvents: ['mousedown', 'keydown', 'touchstart', 'scroll'],
  activityThrottleMs: 30 * 1000,         // Throttle activity pings
};
```

### 4.13.3 Session Timeout Modal

Rules:
- Modal is non-dismissable (must choose action)
- Countdown timer shows remaining time
- Two actions: "Stay Signed In" or "Sign Out"
- "Stay Signed In" triggers token refresh
- Modal blocks all other interactions

```typescript
interface SessionTimeoutModalProps {
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}

// Example implementation
function SessionTimeoutModal({ remainingSeconds, onExtend, onLogout }: SessionTimeoutModalProps) {
  return (
    <Dialog open modal>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Session Expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTime(remainingSeconds)}.
            Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <span className="text-4xl font-mono tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onLogout}>
            Sign Out
          </Button>
          <Button onClick={onExtend}>
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.13.4 Activity Tracking Hook

```typescript
function useActivityTracker() {
  const lastActivityRef = useRef(Date.now());
  const { refreshSession } = useAuth();
  
  useEffect(() => {
    const handleActivity = throttle(() => {
      lastActivityRef.current = Date.now();
    }, SESSION_CONFIG.activityThrottleMs);
    
    SESSION_CONFIG.activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    return () => {
      SESSION_CONFIG.activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);
  
  return {
    getLastActivity: () => lastActivityRef.current,
    isIdle: () => Date.now() - lastActivityRef.current > SESSION_CONFIG.idleThresholdMs,
  };
}
```

### 4.13.5 Session Provider Implementation

```typescript
function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>('active');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const { user, refreshToken, logout } = useAuth();
  const { getLastActivity, isIdle } = useActivityTracker();
  
  // Check session status periodically
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = expiresAt ? expiresAt - now : Infinity;
      
      if (remaining <= 0) {
        setSessionState('expired');
      } else if (remaining <= SESSION_CONFIG.tokenExpiryWarningMs) {
        setSessionState('expiring');
      } else if (isIdle()) {
        setSessionState('idle');
      } else {
        setSessionState('active');
      }
      
      // Auto-refresh if active and approaching expiry
      if (
        sessionState === 'active' &&
        remaining <= SESSION_CONFIG.tokenRefreshThresholdMs &&
        remaining > SESSION_CONFIG.tokenExpiryWarningMs
      ) {
        refreshToken();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [user, expiresAt, sessionState]);
  
  // Handle expired state
  useEffect(() => {
    if (sessionState === 'expired') {
      logout({ reason: 'session_expired', returnTo: window.location.pathname });
    }
  }, [sessionState]);
  
  const handleExtendSession = async () => {
    setSessionState('refreshing');
    await refreshToken();
    setSessionState('active');
  };
  
  return (
    <SessionContext.Provider value={{ sessionState, expiresAt }}>
      {children}
      {sessionState === 'expiring' && (
        <SessionTimeoutModal
          remainingSeconds={Math.floor((expiresAt! - Date.now()) / 1000)}
          onExtend={handleExtendSession}
          onLogout={() => logout()}
        />
      )}
    </SessionContext.Provider>
  );
}
```

### 4.13.6 Unsaved Changes Protection

Rules:
- Track forms with unsaved changes
- Warn before session logout if unsaved work exists
- Offer to save draft before logout (if supported)

```typescript
function useUnsavedChangesGuard(hasChanges: boolean) {
  const { sessionState } = useSession();
  
  // Browser beforeunload
  useEffect(() => {
    if (!hasChanges) return;
    
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);
  
  // Session expiry with unsaved changes
  useEffect(() => {
    if (sessionState === 'expiring' && hasChanges) {
      // Trigger auto-save if available
      triggerAutoSave();
    }
  }, [sessionState, hasChanges]);
}
```

### 4.13.7 Multi-Tab Session Sync

Rules:
- Session state must sync across browser tabs
- Logout in one tab must logout all tabs
- Session extension in one tab extends all tabs

```typescript
function useSessionSync() {
  useEffect(() => {
    const channel = new BroadcastChannel('session-sync');
    
    channel.onmessage = (event) => {
      switch (event.data.type) {
        case 'logout':
          window.location.href = '/login';
          break;
        case 'session-extended':
          // Refresh local session state
          queryClient.invalidateQueries({ queryKey: ['session'] });
          break;
      }
    };
    
    return () => channel.close();
  }, []);
  
  const broadcastLogout = () => {
    const channel = new BroadcastChannel('session-sync');
    channel.postMessage({ type: 'logout' });
    channel.close();
  };
  
  const broadcastSessionExtended = () => {
    const channel = new BroadcastChannel('session-sync');
    channel.postMessage({ type: 'session-extended' });
    channel.close();
  };
  
  return { broadcastLogout, broadcastSessionExtended };
}
```

### 4.13.8 Login Redirect with Return URL

Rules:
- Preserve intended destination on session expiry
- Return URL must be validated (no open redirects)
- Deep links must work after re-authentication

```typescript
function useLoginRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const redirectToLogin = (reason?: string) => {
    const returnTo = encodeURIComponent(pathname + searchParams.toString());
    const loginUrl = `/login?returnTo=${returnTo}${reason ? `&reason=${reason}` : ''}`;
    router.replace(loginUrl);
  };
  
  const handlePostLogin = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo && isValidReturnUrl(returnTo)) {
      router.replace(decodeURIComponent(returnTo));
    } else {
      router.replace('/dashboard');
    }
  };
  
  return { redirectToLogin, handlePostLogin };
}

// Validate return URL to prevent open redirects
function isValidReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return url.startsWith('/') && !url.startsWith('//');
  }
}
```

### 4.13.9 Session Expired Page

```typescript
// app/session-expired/page.tsx
export default function SessionExpiredPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Session Expired</CardTitle>
          <CardDescription>
            Your session has expired due to inactivity.
            Please sign in again to continue.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/login${returnTo ? `?returnTo=${returnTo}` : ''}`}>
              Sign In Again
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 4.13.10 Session Timeout Testing

Rules:
- Session timeout behavior must be testable
- Provide dev tools to simulate timeout states
- Test all edge cases: refresh success, refresh failure, network error

```typescript
// Dev-only session debug panel
function SessionDebugPanel() {
  const { setSessionState, setExpiresAt } = useSessionDebug();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-muted rounded-lg">
      <p className="text-sm font-medium mb-2">Session Debug</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setExpiresAt(Date.now() + 30000)}>
          Expire in 30s
        </Button>
        <Button size="sm" onClick={() => setSessionState('expired')}>
          Force Expire
        </Button>
      </div>
    </div>
  );
}
```

---

## 4.14 FORBIDDEN PRACTICES (UPDATED)

You must not:
- Bypass guards for faster dev
- Render portal pages before identity hydration
- Allow tenant switching in vendor portal
- Hide actions without enforcing guard checks
- Hardcode roles/permissions inconsistent with backend
- Allow session expiry without warning modal
- Lose user's unsaved work on session timeout
- Ignore multi-tab session synchronization
- Accept unvalidated return URLs (open redirect vulnerability)

---

## 4.15 EXECUTION DIRECTIVE

All protected UI must:
- Require identity hydration
- Enforce portal-level guards
- Respect tenant context rules
- Enforce RBAC + entitlements consistently
- Handle session timeout gracefully
- Protect unsaved user work
- Sync session state across tabs

Security is a first-class feature.

END OF WEB PART 4.