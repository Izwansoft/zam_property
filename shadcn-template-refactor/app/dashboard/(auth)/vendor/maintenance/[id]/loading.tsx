import { OwnerMaintenanceDetailSkeleton } from "@/modules/maintenance/components/owner-maintenance-detail";

export default function VendorMaintenanceDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <OwnerMaintenanceDetailSkeleton />
    </div>
  );
}
