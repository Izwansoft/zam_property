// =============================================================================
// Payment Processing — Content (client component)
// =============================================================================
// Handles return from FPX/card 3DS redirect.
// URL: /dashboard/tenant/bills/payment?paymentId=xxx&billingId=xxx
// =============================================================================

"use client";

import { Suspense } from "react";
import { PaymentProcessing } from "@/modules/payment/components/payment-processing";
import { Skeleton } from "@/components/ui/skeleton";

function PaymentProcessingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Skeleton className="mb-4 h-16 w-16 rounded-full" />
      <Skeleton className="mb-2 h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export function PaymentProcessingContent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Suspense fallback={<PaymentProcessingFallback />}>
        <PaymentProcessing />
      </Suspense>
    </div>
  );
}
