import { Skeleton } from "@/components/ui/skeleton";

export default function TenantBillPaymentLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Skeleton className="mb-4 h-16 w-16 rounded-full" />
      <Skeleton className="mb-2 h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
