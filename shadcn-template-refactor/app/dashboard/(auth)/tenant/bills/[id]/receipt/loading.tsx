import { ReceiptViewerSkeleton } from "@/modules/payment/components/receipt";

export default function TenantReceiptLoading() {
  return (
    <div className="p-4 md:p-6">
      <ReceiptViewerSkeleton />
    </div>
  );
}
