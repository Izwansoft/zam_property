import { BillDetailSkeleton } from "@/modules/billing/components/bill-detail";

export default function TenantBillDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <BillDetailSkeleton />
    </div>
  );
}
