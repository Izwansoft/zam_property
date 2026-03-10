// =============================================================================
// Auth Types — User, AuthState, Role, Permission
// =============================================================================
// Matches backend Prisma schema enums exactly. Do NOT invent roles/statuses.
// =============================================================================

// ---------------------------------------------------------------------------
// Role enum (matches backend prisma Role enum)
// ---------------------------------------------------------------------------

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  PARTNER_ADMIN = "PARTNER_ADMIN",
  VENDOR_ADMIN = "VENDOR_ADMIN",
  VENDOR_STAFF = "VENDOR_STAFF",
  CUSTOMER = "CUSTOMER",
  TENANT = "TENANT",
  GUEST = "GUEST",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  AGENT = "AGENT",
}

// ---------------------------------------------------------------------------
// User Status (matches backend prisma UserStatus enum)
// ---------------------------------------------------------------------------

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

// ---------------------------------------------------------------------------
// User — canonical UI identity shape (Part-4 §4.3)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  partnerId: string | null;
  primaryVendorId: string | null;
  /** Whether the user has completed onboarding (for TENANT, VENDOR roles) */
  isOnboarded?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Auth Tokens
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

// ---------------------------------------------------------------------------
// Login Response (POST /auth/login)
// ---------------------------------------------------------------------------

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ---------------------------------------------------------------------------
// Refresh Response (POST /auth/refresh)
// ---------------------------------------------------------------------------

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// Register Request (POST /auth/register)
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// Login Request (POST /auth/login)
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Auth State — tracks authentication lifecycle
// ---------------------------------------------------------------------------

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms when access token expires
}

// ---------------------------------------------------------------------------
// Portal type — derived from user role
// ---------------------------------------------------------------------------

export type Portal = "platform" | "partner" | "vendor" | "account" | "tenant" | "company" | "agent" | "affiliate";

/**
 * Maps a user role to its default portal.
 */
export function roleToPortal(role: Role): Portal {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "platform";
    case Role.PARTNER_ADMIN:
      return "partner";
    case Role.VENDOR_ADMIN:
    case Role.VENDOR_STAFF:
      return "vendor";
    case Role.COMPANY_ADMIN:
      return "company";
    case Role.AGENT:
      return "agent";
    case Role.TENANT:
      return "tenant";
    case Role.CUSTOMER:
    case Role.GUEST:
    default:
      return "account";
  }
}

/**
 * Maps a user role to the dashboard base path.
 */
export function roleToDefaultPath(role: Role): string {
  return `/dashboard/${roleToPortal(role)}`;
}

// ---------------------------------------------------------------------------
// Permission helpers (Part-4 §4.8)
// ---------------------------------------------------------------------------

/** Roles that have platform-level access */
export const PLATFORM_ROLES: readonly Role[] = [Role.SUPER_ADMIN];

/** Roles that have partner-level access */
export const PARTNER_ROLES: readonly Role[] = [Role.PARTNER_ADMIN];

/** Roles that have vendor-level access */
export const VENDOR_ROLES: readonly Role[] = [Role.VENDOR_ADMIN, Role.VENDOR_STAFF];

/** Roles that have customer-level access */
export const CUSTOMER_ROLES: readonly Role[] = [Role.CUSTOMER];

/** Roles that have tenant-level access */
export const TENANT_ROLES: readonly Role[] = [Role.TENANT];

/** Roles that have company-level access */
export const COMPANY_ADMIN_ROLES: readonly Role[] = [Role.COMPANY_ADMIN];

/** Roles that have agent-level access */
export const AGENT_ROLES: readonly Role[] = [Role.AGENT];

/**
 * Role hierarchy level — higher value = more privileged.
 * Used to determine if a role satisfies a minimum level check.
 */
const ROLE_LEVEL: Record<Role, number> = {
  [Role.GUEST]: 0,
  [Role.CUSTOMER]: 1,
  [Role.TENANT]: 2,
  [Role.AGENT]: 3,
  [Role.VENDOR_STAFF]: 3,
  [Role.VENDOR_ADMIN]: 4,
  [Role.COMPANY_ADMIN]: 4,
  [Role.PARTNER_ADMIN]: 5,
  [Role.SUPER_ADMIN]: 6,
};

/**
 * Check if `userRole` is at least as privileged as `requiredRole`.
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
