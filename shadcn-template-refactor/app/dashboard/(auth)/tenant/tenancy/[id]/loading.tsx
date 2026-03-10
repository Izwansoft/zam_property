import { TenancyDetailSkeleton } from "@/modules/tenancy/components/tenancy-detail";

export default function TenantTenancyDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <TenancyDetailSkeleton />
    </div>
  );
}
