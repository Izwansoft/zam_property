// =============================================================================
// Step 5: Payment — Payment method selection and processing
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import {
  CreditCard,
  Building2,
  CheckCircle,
  Info,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { RegistrationFormValues } from "./registration-schema";
import { useCompanyRegistrationStore } from "../../store/registration-store";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepPayment() {
  const { watch, setValue } = useFormContext<RegistrationFormValues>();
  const paymentIntentId = watch("paymentIntentId");
  const selectedPlanId = watch("selectedPlanId");
  const billingCycle = watch("billingCycle");
  const { data: storeData } = useCompanyRegistrationStore();

  const isPaid = !!paymentIntentId;

  // Simulate payment completion
  const handleSimulatePayment = () => {
    const mockPaymentId = `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setValue("paymentIntentId", mockPaymentId, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payment
          </CardTitle>
          <CardDescription>
            Complete payment to finish registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="font-medium text-sm">Order Summary</h4>
            <div className="flex items-center justify-between text-sm">
              <span>
                Subscription Plan
                <Badge variant="outline" className="ml-2">
                  {selectedPlanId || "Not selected"}
                </Badge>
              </span>
              <span className="text-muted-foreground">
                {billingCycle === "yearly" ? "Annual" : "Monthly"} billing
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Company</span>
              <span className="text-muted-foreground">
                {storeData.companyName || "—"}
              </span>
            </div>
          </div>

          {isPaid ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle className="size-10 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Payment Received
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Reference: {paymentIntentId}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Methods */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary/50",
                    "border-primary bg-primary/5"
                  )}
                >
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">FPX Online Banking</p>
                    <p className="text-xs text-muted-foreground">
                      Pay via Malaysian bank
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <CreditCard className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Credit/Debit Card</p>
                    <p className="text-xs text-muted-foreground">
                      Coming soon
                    </p>
                  </div>
                </button>
              </div>

              <Alert>
                <Info className="size-4" />
                <AlertTitle>Secure Payment</AlertTitle>
                <AlertDescription>
                  You will be redirected to your bank&apos;s secure login page to
                  complete the payment.
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={handleSimulatePayment}
              >
                <Building2 className="size-4 mr-2" />
                Pay with FPX
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
