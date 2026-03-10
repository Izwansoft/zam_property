import { InspectionDetailSkeleton } from "@/modules/inspection/components/inspection-detail";

export default function VendorInspectionDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <InspectionDetailSkeleton />
    </div>
  );
}
