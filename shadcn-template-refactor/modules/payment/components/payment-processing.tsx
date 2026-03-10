// =============================================================================
// PaymentProcessing — Shown during payment redirect return
// =============================================================================
// Handles the return from FPX bank auth or card 3DS.
// Polls payment status and shows result.
// =============================================================================

"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { usePaymentStatus } from "../hooks/usePaymentStatus";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentProcessing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("paymentId");
  const billingId = searchParams.get("billingId");

  const { data: payment, isLoading, isSuccess, isFailed, isProcessing } =
    usePaymentStatus({
      paymentId,
      enabled: !!paymentId,
      pollInterval: 2000,
    });

  // Auto-redirect to bill detail after success
  useEffect(() => {
    if (isSuccess && billingId) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/tenant/bills/${billingId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, billingId, router]);

  if (!paymentId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">Invalid Payment Reference</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          No payment reference found. Please try again from the bill detail page.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/tenant/bills")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bills
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Skeleton className="mb-4 h-16 w-16 rounded-full" />
        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  // Processing state
  if (isProcessing || (!isSuccess && !isFailed)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Processing Your Payment</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we confirm your payment. This may take a few moments.
        </p>
      </div>
    );
  }

  // Success state
  if (isSuccess && payment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Payment Successful!</h2>
        <p className="mb-1 text-muted-foreground">
          Your payment of {formatCurrency(payment.amount)} has been processed.
        </p>
        {payment.receiptNumber && (
          <p className="mb-4 text-xs text-muted-foreground">
            Receipt: {payment.receiptNumber}
          </p>
        )}
        <Alert className="mb-4 max-w-sm text-left">
          <AlertDescription>
            You will be redirected to your bill in a few seconds...
          </AlertDescription>
        </Alert>
        <Button
          onClick={() =>
            router.push(
              billingId
                ? `/dashboard/tenant/bills/${billingId}`
                : "/dashboard/tenant/bills"
            )
          }
        >
          View Bill
        </Button>
      </div>
    );
  }

  // Failed state
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Payment Failed</h2>
      <p className="mb-4 text-muted-foreground">
        We couldn&apos;t process your payment.
        {payment?.failureReason && ` Reason: ${payment.failureReason}`}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/tenant/bills")}
        >
          Back to Bills
        </Button>
        {billingId && (
          <Button
            onClick={() =>
              router.push(`/dashboard/tenant/bills/${billingId}`)
            }
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
