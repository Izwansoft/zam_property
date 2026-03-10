"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  useAccountSettings,
  useUpdateAccountSettings,
} from "@/modules/account/hooks/use-account-settings";
import {
  AccountSettingsForm,
  AccountSettingsFormSkeleton,
} from "@/modules/account/components/account-settings-form";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import type { UpdateAccountSettingsDto } from "@/modules/account/types";

export function AgentSettingsContent() {
  const { data: settings, isLoading, error } = useAccountSettings();
  const updateMutation = useUpdateAccountSettings();

  const handleSave = (dto: UpdateAccountSettingsDto) => {
    updateMutation.mutate(dto, {
      onSuccess: () => showSuccess("Settings saved successfully."),
      onError: () => showError("Failed to save settings. Please try again."),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Settings"
        description="Configure your language, timezone, and privacy preferences."
        breadcrumbOverrides={[
          { segment: "agent", label: "Agent Portal" },
          { segment: "settings", label: "Settings" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load settings. Please try again.
        </div>
      )}

      {isLoading && <AccountSettingsFormSkeleton />}

      {settings && (
        <AccountSettingsForm
          settings={settings}
          onSave={handleSave}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  );
}
