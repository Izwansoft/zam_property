import { AccountSettingsFormSkeleton } from "@/modules/account/components/account-settings-form";

export default function AgentSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <AccountSettingsFormSkeleton />
    </div>
  );
}
