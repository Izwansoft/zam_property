// =============================================================================
// Auth API — HTTP functions for authentication
// =============================================================================
// All auth-related API calls go through this file.
// Uses the central API client with interceptors.
// =============================================================================

import { apiClient, type ApiResponse } from "@/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  User,
} from "../types";

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    credentials
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// POST /auth/refresh
// ---------------------------------------------------------------------------

export async function refreshTokenApi(refreshToken: string): Promise<RefreshResponse> {
  const response = await apiClient.post<ApiResponse<RefreshResponse>>(
    "/auth/refresh",
    { refreshToken }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------

export async function registerApi(data: RegisterRequest): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>(
    "/auth/register",
    data
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// GET /users/me
// ---------------------------------------------------------------------------

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>("/users/me");
  return response.data.data;
}

// ---------------------------------------------------------------------------
// POST /auth/logout (optional — backend may not require)
// ---------------------------------------------------------------------------

export async function logoutApi(): Promise<void> {
  // Backend logout endpoint is optional in this project.
  // Keep it opt-in to avoid expected 404 noise in browser console.
  if (process.env.NEXT_PUBLIC_ENABLE_LOGOUT_API !== "true") {
    return;
  }

  try {
    await apiClient.post("/auth/logout");
  } catch {
    // Logout is best-effort — always clear local state regardless.
  }
}
