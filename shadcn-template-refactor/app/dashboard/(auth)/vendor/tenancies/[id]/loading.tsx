import { TenancyDetailSkeleton } from "@/modules/tenancy/components/tenancy-detail";

export default function VendorTenancyDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <TenancyDetailSkeleton />
    </div>
  );
}
