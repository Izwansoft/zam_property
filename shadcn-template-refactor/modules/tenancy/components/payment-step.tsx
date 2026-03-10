// =============================================================================
// PaymentStep — Deposit payment component for tenancy booking
// =============================================================================
// Handles payment method selection and deposit payment flow.
// Supports: Credit Card (Stripe), FPX (Malaysian bank transfer), Manual Bank Transfer.
// =============================================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  Building2,
  Receipt,
  CheckCircle2,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentMethod = "card" | "fpx" | "manual";

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  status: "pending" | "processing" | "succeeded" | "failed";
}

interface PaymentStepProps {
  /** Total deposit amount to pay */
  depositAmount: number;
  /** Currency (default MYR) */
  currency?: string;
  /** Callback when payment is initiated/completed */
  onPaymentComplete: (details: PaymentDetails) => void;
  /** Is the payment being processed */
  isProcessing?: boolean;
  /** Listing title for display */
  listingTitle?: string;
  /** Security deposit breakdown */
  securityDeposit?: number;
  /** Utility deposit breakdown */
  utilityDeposit?: number;
}

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const cardPaymentSchema = z.object({
  method: z.literal("card"),
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(19),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid format (MM/YY)"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  cardholderName: z.string().min(2, "Cardholder name is required"),
});

const fpxPaymentSchema = z.object({
  method: z.literal("fpx"),
  bankCode: z.string().min(1, "Please select a bank"),
});

const manualPaymentSchema = z.object({
  method: z.literal("manual"),
  referenceNumber: z.string().optional(),
});

const paymentFormSchema = z.discriminatedUnion("method", [
  cardPaymentSchema,
  fpxPaymentSchema,
  manualPaymentSchema,
]);

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// ---------------------------------------------------------------------------
// FPX Bank List (Malaysian banks)
// ---------------------------------------------------------------------------

const FPX_BANKS = [
  { code: "MBB", name: "Maybank" },
  { code: "CIMB", name: "CIMB Bank" },
  { code: "PBB", name: "Public Bank" },
  { code: "RHB", name: "RHB Bank" },
  { code: "HLB", name: "Hong Leong Bank" },
  { code: "AMB", name: "AmBank" },
  { code: "BOCM", name: "Bank of China" },
  { code: "BIMB", name: "Bank Islam" },
  { code: "BMMB", name: "Bank Muamalat" },
  { code: "BSN", name: "BSN" },
  { code: "HSBC", name: "HSBC Bank" },
  { code: "OCBC", name: "OCBC Bank" },
  { code: "SCB", name: "Standard Chartered" },
  { code: "UOB", name: "UOB Bank" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentStep({
  depositAmount,
  currency = "MYR",
  onPaymentComplete,
  isProcessing = false,
  listingTitle,
  securityDeposit,
  utilityDeposit,
}: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      method: "card",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === "card") {
      form.reset({
        method: "card",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: "",
      });
    } else if (method === "fpx") {
      form.reset({
        method: "fpx",
        bankCode: "",
      });
    } else {
      form.reset({
        method: "manual",
        referenceNumber: "",
      });
    }
  };

  const onSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, generate a mock payment intent ID
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      onPaymentComplete({
        method: values.method,
        amount: depositAmount,
        currency,
        paymentIntentId,
        status: "succeeded",
      });
    } catch {
      onPaymentComplete({
        method: values.method,
        amount: depositAmount,
        currency,
        status: "failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || isProcessing;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listingTitle && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{listingTitle}</span>
            </div>
          )}
          {securityDeposit !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Security Deposit</span>
              <span>{formatCurrency(securityDeposit, currency)}</span>
            </div>
          )}
          {utilityDeposit !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Utility Deposit</span>
              <span>{formatCurrency(utilityDeposit, currency)}</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Deposit</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(depositAmount, currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Select Payment Method</Label>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => handleMethodChange(value as PaymentMethod)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {/* Credit Card */}
          <Label
            htmlFor="card"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              selectedMethod === "card"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="card" id="card" className="sr-only" />
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                selectedMethod === "card"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Credit Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
            </div>
          </Label>

          {/* FPX */}
          <Label
            htmlFor="fpx"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              selectedMethod === "fpx"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="fpx" id="fpx" className="sr-only" />
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                selectedMethod === "fpx"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">FPX</p>
              <p className="text-xs text-muted-foreground">Online Banking</p>
            </div>
          </Label>

          {/* Manual Bank Transfer */}
          <Label
            htmlFor="manual"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              selectedMethod === "manual"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="manual" id="manual" className="sr-only" />
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                selectedMethod === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Manual Transfer</p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Payment Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Credit Card Fields */}
          {selectedMethod === "card" && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardholderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardholder Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Name on card"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            disabled={loading}
                            onChange={(e) => {
                              // Add spaces every 4 digits
                              const value = e.target.value.replace(/\s/g, "");
                              const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MM/YY"
                              maxLength={5}
                              disabled={loading}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length >= 2) {
                                  value = value.substring(0, 2) + "/" + value.substring(2);
                                }
                                field.onChange(value.substring(0, 5));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="123"
                              maxLength={3}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FPX Bank Selection */}
          {selectedMethod === "fpx" && (
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Your Bank</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FPX_BANKS.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>FPX Payment</AlertTitle>
                  <AlertDescription>
                    You will be redirected to your bank&apos;s secure login page to
                    complete the payment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Manual Bank Transfer Instructions */}
          {selectedMethod === "manual" && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Bank Transfer Instructions</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <p>Please transfer the deposit amount to:</p>
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <p>
                          <strong>Bank:</strong> Maybank
                        </p>
                        <p>
                          <strong>Account Name:</strong> Zam Property Sdn Bhd
                        </p>
                        <p>
                          <strong>Account Number:</strong> 5123 4567 8901
                        </p>
                        <p>
                          <strong>Reference:</strong> Your booking will be confirmed
                          once payment is verified (1-2 business days).
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your bank transfer reference"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Alert variant="default" className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your payment information is encrypted and secure. This deposit is
              refundable according to the tenancy terms.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                {selectedMethod === "manual" ? "Confirm Booking" : "Pay Deposit"}
                <span className="ml-2">
                  ({formatCurrency(depositAmount, currency)})
                </span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment Success Component
// ---------------------------------------------------------------------------

interface PaymentSuccessProps {
  paymentDetails: PaymentDetails;
  onContinue?: () => void;
}

export function PaymentSuccess({ paymentDetails, onContinue }: PaymentSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Payment Successful!</h3>
      <p className="mb-1 text-muted-foreground">
        Your deposit of {formatCurrency(paymentDetails.amount, paymentDetails.currency)} has
        been received.
      </p>
      {paymentDetails.paymentIntentId && (
        <p className="mb-4 text-xs text-muted-foreground">
          Reference: {paymentDetails.paymentIntentId}
        </p>
      )}
      {onContinue && (
        <Button onClick={onContinue} className="mt-4">
          Continue
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment Failed Component
// ---------------------------------------------------------------------------

interface PaymentFailedProps {
  onRetry?: () => void;
}

export function PaymentFailed({ onRetry }: PaymentFailedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Payment Failed</h3>
      <p className="mb-4 text-muted-foreground">
        We couldn&apos;t process your payment. Please try again or choose a
        different payment method.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
