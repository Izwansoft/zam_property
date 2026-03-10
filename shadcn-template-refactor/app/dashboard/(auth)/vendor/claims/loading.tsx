import { Skeleton } from "@/components/ui/skeleton";

export default function VendorClaimsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
