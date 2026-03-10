import { ProfileViewCardSkeleton } from "@/modules/account/components/profile-view-card";

export default function AgentProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <ProfileViewCardSkeleton />
    </div>
  );
}
