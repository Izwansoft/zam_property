import { TenancyCardSkeleton } from "@/modules/tenancy/components/tenancy-card";

export default function AgentTenanciesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        <TenancyCardSkeleton />
        <TenancyCardSkeleton />
        <TenancyCardSkeleton />
      </div>
    </div>
  );
}
