import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function PlatformListingDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="lg:col-span-3 h-80 rounded-lg" />
        <Skeleton className="lg:col-span-2 h-80 rounded-lg" />
      </div>
    </div>
  );
}
