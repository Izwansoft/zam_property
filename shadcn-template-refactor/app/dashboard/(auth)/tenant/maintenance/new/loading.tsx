import { Skeleton } from "@/components/ui/skeleton";

export default function TenantMaintenanceNewLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
