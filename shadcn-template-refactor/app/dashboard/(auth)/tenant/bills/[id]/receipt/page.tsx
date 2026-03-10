import { Suspense } from "react";
import { generateMeta } from "@/lib/utils";
import { TenantReceiptContent } from "./content";
import { ReceiptViewerSkeleton } from "@/modules/payment/components/receipt";

export function generateMetadata() {
  return generateMeta({
    title: "Payment Receipt - Tenant Portal",
    description: "View and download your payment receipt",
    canonical: "/dashboard/tenant/bills",
  });
}

export default function TenantReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <ReceiptViewerSkeleton />
        </div>
      }
    >
      <TenantReceiptContent />
    </Suspense>
  );
}
