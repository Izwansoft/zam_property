// =============================================================================
// useSecurity — Password change and account deletion
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import type { ChangePasswordDto, DeleteAccountDto } from "../types";

export function useChangePassword() {
  return useApiMutation<{ message: string }, ChangePasswordDto>({
    path: "/account/change-password",
    method: "POST",
  });
}

export function useDeleteAccount() {
  return useApiMutation<{ message: string }, DeleteAccountDto>({
    path: "/account/delete-account",
    method: "POST",
  });
}
