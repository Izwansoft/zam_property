import { MaintenanceDetailSkeleton } from "@/modules/maintenance/components/maintenance-detail";

export default function TenantMaintenanceDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <MaintenanceDetailSkeleton />
    </div>
  );
}
