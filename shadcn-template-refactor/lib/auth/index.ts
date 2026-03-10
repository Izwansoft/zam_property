// Auth utilities — re-export core auth types and helpers for convenience
// Domain modules should import from @modules/auth for the full API.
// This barrel provides the most commonly used utilities.

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
} from "@/modules/auth/types";

export type {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AuthStatus,
  AuthState,
  Portal,
} from "@/modules/auth/types";

// Route protection config
export {
  matchRoute,
  isRoleAllowed,
  canAccessPortal,
  isStaticPath,
  ROUTE_RULES,
  PORTAL_ROLE_MAP,
} from "./route-config";

export type { RouteRule } from "./route-config";
