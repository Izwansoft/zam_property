"use client";

// =============================================================================
// Auth Context — AuthProvider, identity hydration, session management
// =============================================================================
// Provides authentication state across the entire app.
// Must be mounted inside QueryClientProvider (in providers.tsx).
//
// Key responsibilities:
// - Hydrate user identity from stored token on mount
// - Provide login/logout/refresh actions
// - Expose hasRole/hasPermission helpers
// - Wire token getter into API client (setTokenGetter)
// - Broadcast logout across tabs (BroadcastChannel)
// =============================================================================

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setTokenGetter, setRefreshHandler } from "@/lib/api/client";
import { normalizeError, type AppError } from "@/lib/errors";
import {
  loginApi,
  refreshTokenApi,
  fetchCurrentUser,
  logoutApi,
} from "../api/auth-api";
import type {
  User,
  AuthStatus,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RefreshResponse,
} from "../types";
import { Role, roleToDefaultPath } from "../types";
import { registerApi } from "../api/auth-api";

// ---------------------------------------------------------------------------
// Token Storage Keys
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = "zam_access_token";
const REFRESH_TOKEN_KEY = "zam_refresh_token";
const EXPIRES_AT_KEY = "zam_token_expires_at";

// ---------------------------------------------------------------------------
// Token Storage Helpers
// ---------------------------------------------------------------------------

/** Cookie key for edge proxy auth check */
const AUTH_TOKEN_COOKIE = "zam_access_token";
const AUTH_ROLE_COOKIE = "zam_user_role";

function setAuthCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSeconds};SameSite=Lax`;
}

function clearAuthCookie(name: string): void {
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
}

function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  // Set cookie for edge proxy to read
  setAuthCookie(AUTH_TOKEN_COOKIE, accessToken, expiresIn);
}

/** Store user role in cookie for edge proxy portal-level gating */
function storeRoleCookie(role: string): void {
  // Long-lived cookie — cleared on logout
  setAuthCookie(AUTH_ROLE_COOKIE, role, 7 * 24 * 60 * 60);
}

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getStoredExpiresAt(): number | null {
  const val = localStorage.getItem(EXPIRES_AT_KEY);
  return val ? Number(val) : null;
}

function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  // Clear edge proxy cookies
  clearAuthCookie(AUTH_TOKEN_COOKIE);
  clearAuthCookie(AUTH_ROLE_COOKIE);
}

// ---------------------------------------------------------------------------
// BroadcastChannel — multi-tab session sync (Part-4 §4.13.7)
// ---------------------------------------------------------------------------

const SESSION_CHANNEL_NAME = "zam-session-sync";

type SessionMessage =
  | { type: "logout" }
  | { type: "session-extended" }
  | { type: "login" };

function broadcastSessionEvent(event: SessionMessage): void {
  try {
    const channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel not supported — ignore
  }
}

// ---------------------------------------------------------------------------
// Auth Context Value
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  // State
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  expiresAt: number | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: (options?: { reason?: string; returnTo?: string }) => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // Permission helpers (Part-4 §4.8)
  hasRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// AuthProvider Component
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Track if a refresh is in-flight (prevent concurrent refreshes)
  const isRefreshingRef = useRef(false);
  // Queue of promises waiting for refresh to complete
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const clearAuthState = useCallback(() => {
    clearStoredTokens();
    setUser(null);
    setAccessToken(null);
    setExpiresAt(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  // -------------------------------------------------------------------------
  // Wire token getter into API client
  // -------------------------------------------------------------------------

  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  useEffect(() => {
    setTokenGetter(() => accessTokenRef.current);
  }, []);

  useEffect(() => {
    const handleAuthInvalid = () => {
      clearAuthState();
    };

    window.addEventListener("zam:auth-invalid", handleAuthInvalid);
    return () => {
      window.removeEventListener("zam:auth-invalid", handleAuthInvalid);
    };
  }, [clearAuthState]);

  // -------------------------------------------------------------------------
  // Wire refresh handler into API client (401 interceptor)
  // The ref is set after refreshSession is defined below.
  // -------------------------------------------------------------------------

  const refreshSessionRef = useRef<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    setRefreshHandler(() => {
      if (refreshSessionRef.current) {
        return refreshSessionRef.current();
      }
      return Promise.resolve(false);
    });
  }, []);

  // -------------------------------------------------------------------------
  // Multi-tab session sync
  // -------------------------------------------------------------------------

  useEffect(() => {
    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(SESSION_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<SessionMessage>) => {
        switch (event.data.type) {
          case "logout":
            // Clear local state — don't broadcast again
            clearAuthState();
            break;
          case "login":
          case "session-extended":
            // Re-hydrate from storage (other tab updated tokens)
            hydrateFromStorage();
            break;
        }
      };
    } catch {
      // BroadcastChannel not supported
      return;
    }

    return () => {
      channel.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Hydrate identity on mount
  // -------------------------------------------------------------------------

  const hydrateFromStorage = useCallback(async () => {
    const storedToken = getStoredAccessToken();
    const storedExpires = getStoredExpiresAt();
    const storedRefresh = getStoredRefreshToken();

    if (!storedToken) {
      setStatus("unauthenticated");
      return;
    }

    // Access token is already expired locally: refresh first instead of hitting /users/me.
    if (storedExpires && storedExpires <= Date.now()) {
      if (!storedRefresh) {
        clearAuthState();
        return;
      }

      try {
        const refreshed = await refreshTokenApi(storedRefresh);
        storeTokens(
          refreshed.accessToken,
          refreshed.refreshToken,
          refreshed.expiresIn
        );
        setAccessToken(refreshed.accessToken);
        accessTokenRef.current = refreshed.accessToken;
        setExpiresAt(Date.now() + refreshed.expiresIn * 1000);

        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setStatus("authenticated");
        storeRoleCookie(currentUser.role);
        return;
      } catch {
        clearAuthState();
        return;
      }
    }

    setStatus("loading");
    setAccessToken(storedToken);
    // Update ref immediately so API calls have the token before re-render
    accessTokenRef.current = storedToken;
    setExpiresAt(storedExpires);

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      storeRoleCookie(currentUser.role);
    } catch (err) {
      // Token might be expired — try refresh
      if (storedRefresh) {
        try {
          const refreshed = await refreshTokenApi(storedRefresh);
          storeTokens(
            refreshed.accessToken,
            refreshed.refreshToken,
            refreshed.expiresIn
          );
          setAccessToken(refreshed.accessToken);
          setExpiresAt(Date.now() + refreshed.expiresIn * 1000);

          const currentUser = await fetchCurrentUser();
          setUser(currentUser);
          setStatus("authenticated");
          storeRoleCookie(currentUser.role);
          return;
        } catch {
          // Refresh also failed — clear everything
        }
      }

      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------

  const login = useCallback(
    async (credentials: LoginRequest): Promise<User> => {
      const result: LoginResponse = await loginApi(credentials);

      storeTokens(
        result.accessToken,
        result.refreshToken,
        result.expiresIn
      );
      storeRoleCookie(result.user.role);

      setAccessToken(result.accessToken);
      setExpiresAt(Date.now() + result.expiresIn * 1000);
      setUser(result.user);
      setStatus("authenticated");

      broadcastSessionEvent({ type: "login" });

      return result.user;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Register
  // -------------------------------------------------------------------------

  const register = useCallback(
    async (data: RegisterRequest): Promise<User> => {
      const newUser = await registerApi(data);
      return newUser;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  const logout = useCallback(
    async (options?: { reason?: string; returnTo?: string }) => {
      // Best-effort backend logout
      await logoutApi();

      // Clear local state
      clearAuthState();

      broadcastSessionEvent({ type: "logout" });

      // Redirect — handled by the calling code (Login page, route guard, etc.)
      // We don't redirect here to keep the context pure.
      // The consuming component / route guard will handle navigation.
    },
    [clearAuthState]
  );

  // -------------------------------------------------------------------------
  // Refresh Session
  // -------------------------------------------------------------------------

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) {
      return false;
    }

    isRefreshingRef.current = true;

    const promise = (async () => {
      try {
        const result: RefreshResponse =
          await refreshTokenApi(storedRefreshToken);

        storeTokens(
          result.accessToken,
          result.refreshToken,
          result.expiresIn
        );

        setAccessToken(result.accessToken);
        setExpiresAt(Date.now() + result.expiresIn * 1000);

        broadcastSessionEvent({ type: "session-extended" });

        return true;
      } catch {
        // Refresh failed — force logout
        clearAuthState();
        return false;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [clearAuthState]);

  // Keep refresh handler ref in sync for the 401 interceptor
  refreshSessionRef.current = refreshSession;

  // -------------------------------------------------------------------------
  // Permission Helpers (Part-4 §4.8)
  // -------------------------------------------------------------------------

  const hasRole = useCallback(
    (...roles: Role[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role as Role);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Permissions are string-based from backend.
      // Currently we derive from role. Will be refined when backend
      // returns explicit permission arrays.
      if (!user) return false;

      // SUPER_ADMIN has all permissions
      if (user.role === Role.SUPER_ADMIN) return true;

      // Permission string format: "resource.action" e.g. "partners.manage"
      const [resource] = permission.split(".");

      switch (user.role) {
        case Role.PARTNER_ADMIN:
          return [
            "vendors",
            "listings",
            "reviews",
            "interactions",
            "analytics",
            "audit",
            "notifications",
            "subscriptions",
            "partner",
          ].includes(resource);
        case Role.VENDOR_ADMIN:
          return [
            "listings",
            "reviews",
            "interactions",
            "vendor",
            "media",
            "notifications",
          ].includes(resource);
        case Role.VENDOR_STAFF:
          return ["listings", "interactions", "notifications"].includes(
            resource
          );
        case Role.CUSTOMER:
          return [
            "account",
            "inquiries",
            "reviews",
            "saved",
            "notifications",
          ].includes(resource);
        default:
          return false;
      }
    },
    [user]
  );

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && user !== null,
      isLoading: status === "idle" || status === "loading",
      accessToken,
      expiresAt,
      login,
      register,
      logout,
      refreshSession,
      hasRole,
      hasPermission,
    }),
    [
      user,
      status,
      accessToken,
      expiresAt,
      login,
      register,
      logout,
      refreshSession,
      hasRole,
      hasPermission,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
