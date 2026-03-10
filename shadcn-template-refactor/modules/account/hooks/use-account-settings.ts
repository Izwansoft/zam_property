// =============================================================================
// useAccountSettings — Account settings (language, timezone, privacy)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { AccountSettings, UpdateAccountSettingsDto } from "../types";

const SETTINGS_KEY = ["account", "settings"] as const;

export function useAccountSettings() {
  return useApiQuery<AccountSettings>({
    queryKey: [...SETTINGS_KEY],
    path: "/account/settings",
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAccountSettings() {
  return useApiMutation<AccountSettings, UpdateAccountSettingsDto>({
    path: "/account/settings",
    method: "PATCH",
    invalidateKeys: [[...SETTINGS_KEY]],
  });
}
