// Auth module — authentication, session management, route guards
export { AuthProvider, AuthContext } from "./context/auth-context";
export type { AuthContextValue } from "./context/auth-context";

export { useAuth, useAuthUser, usePermissions, useLoginRedirect } from "./hooks/use-auth";
export type { PermissionHelpers, LoginRedirectHelpers } from "./hooks/use-auth";

export {
  loginApi,
  refreshTokenApi,
  registerApi,
  fetchCurrentUser,
  logoutApi,
} from "./api/auth-api";

export {
  Role,
  UserStatus,
  roleToPortal,
  roleToDefaultPath,
  isRoleAtLeast,
  PLATFORM_ROLES,
  PARTNER_ROLES,
  VENDOR_ROLES,
  CUSTOMER_ROLES,
} from "./types";

export type {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  AuthStatus,
  AuthState,
  Portal,
} from "./types";
