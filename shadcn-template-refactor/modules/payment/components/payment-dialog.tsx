// =============================================================================
// PaymentDialog — Multi-step payment flow dialog
// =============================================================================
// Steps: Amount → Method/Details → Processing → Success/Failed
// Supports: Credit Card, FPX (Malaysia), Manual Bank Transfer
// Opens as a Dialog from the BillDetail "Pay Now" button.
// =============================================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  Building2,
  Receipt,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  Info,
  FileText,
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { Billing } from "@/modules/billing/types";
import { PaymentMethod } from "@/modules/billing/types";
import type { PaymentDialogStep, CreatePaymentDto } from "../types";
import { PAYMENT_METHOD_OPTIONS } from "../types";
import { useCreatePayment } from "../hooks/useCreatePayment";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { FPXPaymentForm } from "./fpx-payment-form";

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const amountSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(999999.99, "Amount exceeds maximum"),
  paymentType: z.enum(["full", "partial"]),
});

type AmountFormValues = z.infer<typeof amountSchema>;

const cardSchema = z.object({
  cardholderName: z.string().min(2, "Cardholder name is required"),
  cardNumber: z
    .string()
    .min(16, "Card number must be at least 16 digits")
    .max(19),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid format (MM/YY)"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
});

type CardFormValues = z.infer<typeof cardSchema>;

const manualSchema = z.object({
  referenceNumber: z.string().optional(),
});

type ManualFormValues = z.infer<typeof manualSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PaymentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** The billing record to pay for */
  billing: Billing;
  /** Callback after successful payment */
  onPaymentSuccess?: (paymentId: string) => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PaymentDialog({
  open,
  onOpenChange,
  billing,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const partnerId = usePartnerId();

  // Step management
  const [step, setStep] = useState<PaymentDialogStep>("amount");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethod.CARD
  );
  const [paymentAmount, setPaymentAmount] = useState(billing.balanceDue);
  const [fpxBankCode, setFpxBankCode] = useState("");
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  // Mutations & queries
  const createPayment = useCreatePayment();
  const paymentStatus = usePaymentStatus({
    paymentId: createdPaymentId,
    enabled: step === "processing",
  });

  // Amount form
  const amountForm = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: billing.balanceDue,
      paymentType: "full",
    },
  });

  // Card form
  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  });

  // Manual form
  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      referenceNumber: "",
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("amount");
      setSelectedMethod(PaymentMethod.CARD);
      setPaymentAmount(billing.balanceDue);
      setFpxBankCode("");
      setCreatedPaymentId(null);
      amountForm.reset({
        amount: billing.balanceDue,
        paymentType: "full",
      });
      cardForm.reset();
      manualForm.reset();
    }
  }, [open, billing.balanceDue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch payment type for amount switching
  const paymentType = amountForm.watch("paymentType");

  useEffect(() => {
    if (paymentType === "full") {
      amountForm.setValue("amount", billing.balanceDue);
      setPaymentAmount(billing.balanceDue);
    }
  }, [paymentType, billing.balanceDue, amountForm]);

  // Watch for terminal payment status
  useEffect(() => {
    if (paymentStatus.isSuccess) {
      setStep("success");
    } else if (paymentStatus.isFailed) {
      setStep("failed");
    }
  }, [paymentStatus.isSuccess, paymentStatus.isFailed]);

  // ---------------------------------------------------------------------------
  // Step handlers
  // ---------------------------------------------------------------------------

  const handleAmountSubmit = useCallback(
    (values: AmountFormValues) => {
      setPaymentAmount(values.amount);
      setStep("method");
    },
    []
  );

  const handlePaymentSubmit = useCallback(async () => {
    const dto: CreatePaymentDto = {
      billingId: billing.id,
      amount: paymentAmount,
      method: selectedMethod,
      currency: "MYR",
    };

    // Validate method-specific fields
    if (selectedMethod === PaymentMethod.CARD) {
      const valid = await cardForm.trigger();
      if (!valid) return;
    }

    if (selectedMethod === PaymentMethod.FPX) {
      if (!fpxBankCode) return; // Bank must be selected
      dto.bankCode = fpxBankCode;
    }

    if (selectedMethod === PaymentMethod.BANK_TRANSFER) {
      const values = manualForm.getValues();
      dto.referenceNumber = values.referenceNumber;
    }

    setStep("processing");

    try {
      const result = await createPayment.mutateAsync(dto);
      setCreatedPaymentId(result.id);

      // For manual bank transfer, go straight to success
      if (selectedMethod === PaymentMethod.BANK_TRANSFER) {
        setStep("success");
      }
      // For card/FPX, the polling hook will transition to success/failed
    } catch {
      setStep("failed");
    }
  }, [
    billing.id,
    paymentAmount,
    selectedMethod,
    fpxBankCode,
    cardForm,
    manualForm,
    createPayment,
  ]);

  const handleRetry = useCallback(() => {
    setStep("method");
    setCreatedPaymentId(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "success" && createdPaymentId) {
      onPaymentSuccess?.(createdPaymentId);
    }
    onOpenChange(false);
  }, [step, createdPaymentId, onPaymentSuccess, onOpenChange]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isProcessing = step === "processing";
  const canClose = step !== "processing";

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          if (!canClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "amount" && "Payment Amount"}
            {step === "method" && "Payment Details"}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
            {step === "failed" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "amount" &&
              `Pay for bill ${billing.billNumber}`}
            {step === "method" &&
              `Enter your ${selectedMethod === PaymentMethod.CARD ? "card" : selectedMethod === PaymentMethod.FPX ? "FPX" : "bank transfer"} details`}
            {step === "processing" && "Please wait while we process your payment"}
            {step === "success" && "Your payment has been processed successfully"}
            {step === "failed" &&
              "We couldn't process your payment. Please try again."}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Amount */}
        {step === "amount" && (
          <AmountStep
            billing={billing}
            form={amountForm}
            onSubmit={handleAmountSubmit}
          />
        )}

        {/* Step: Method Selection & Details */}
        {step === "method" && (
          <MethodStep
            billing={billing}
            paymentAmount={paymentAmount}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            fpxBankCode={fpxBankCode}
            onFpxBankChange={setFpxBankCode}
            cardForm={cardForm}
            manualForm={manualForm}
            onSubmit={handlePaymentSubmit}
            onBack={() => setStep("amount")}
            isSubmitting={createPayment.isPending}
          />
        )}

        {/* Step: Processing */}
        {step === "processing" && <ProcessingStep />}

        {/* Step: Success */}
        {step === "success" && (
          <SuccessStep
            amount={paymentAmount}
            method={selectedMethod}
            paymentId={createdPaymentId}
            billingId={billing.id}
            isManual={selectedMethod === PaymentMethod.BANK_TRANSFER}
            onClose={handleClose}
          />
        )}

        {/* Step: Failed */}
        {step === "failed" && (
          <FailedStep onRetry={handleRetry} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Sub-components for each step
// =============================================================================

// ---------------------------------------------------------------------------
// Amount Step
// ---------------------------------------------------------------------------

function AmountStep({
  billing,
  form,
  onSubmit,
}: {
  billing: Billing;
  form: ReturnType<typeof useForm<AmountFormValues>>;
  onSubmit: (values: AmountFormValues) => void;
}) {
  const paymentType = form.watch("paymentType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Bill Summary */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bill Number</span>
                <span className="font-medium">{billing.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span>{formatCurrency(billing.totalAmount)}</span>
              </div>
              {billing.paidAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="text-green-600 dark:text-green-400">
                    −{formatCurrency(billing.paidAmount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Balance Due</span>
                <span className="text-primary">
                  {formatCurrency(billing.balanceDue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Type */}
        <FormField
          control={form.control}
          name="paymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="pay-full"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                      paymentType === "full"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem
                      value="full"
                      id="pay-full"
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-medium">Full Amount</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(billing.balanceDue)}
                      </p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="pay-partial"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                      paymentType === "partial"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem
                      value="partial"
                      id="pay-partial"
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-medium">Partial Payment</p>
                      <p className="text-xs text-muted-foreground">
                        Custom amount
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Custom Amount (for partial) */}
        {paymentType === "partial" && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (MYR)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      RM
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min={1}
                      max={billing.balanceDue}
                      className="pl-10"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                {field.value > billing.balanceDue && (
                  <p className="text-xs text-destructive">
                    Amount cannot exceed {formatCurrency(billing.balanceDue)}
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Method Step
// ---------------------------------------------------------------------------

function MethodStep({
  billing,
  paymentAmount,
  selectedMethod,
  onMethodChange,
  fpxBankCode,
  onFpxBankChange,
  cardForm,
  manualForm,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  billing: Billing;
  paymentAmount: number;
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  fpxBankCode: string;
  onFpxBankChange: (code: string) => void;
  cardForm: ReturnType<typeof useForm<CardFormValues>>;
  manualForm: ReturnType<typeof useForm<ManualFormValues>>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const isMethodValid = useCallback(() => {
    if (selectedMethod === PaymentMethod.FPX && !fpxBankCode) return false;
    return true;
  }, [selectedMethod, fpxBankCode]);

  return (
    <div className="space-y-4">
      {/* Amount Summary */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <span className="text-sm text-muted-foreground">Paying</span>
        <span className="text-lg font-semibold text-primary">
          {formatCurrency(paymentAmount)}
        </span>
      </div>

      {/* Method Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Payment Method</Label>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(v) => onMethodChange(v as PaymentMethod)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const Icon =
              option.method === PaymentMethod.CARD
                ? CreditCard
                : option.method === PaymentMethod.FPX
                  ? Building2
                  : Receipt;
            return (
              <Label
                key={option.method}
                htmlFor={`method-${option.method}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  selectedMethod === option.method
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  isSubmitting && "pointer-events-none opacity-50"
                )}
              >
                <RadioGroupItem
                  value={option.method}
                  id={`method-${option.method}`}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    selectedMethod === option.method
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </p>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </div>

      <Separator />

      {/* Method-specific Forms */}
      {selectedMethod === PaymentMethod.CARD && (
        <CardPaymentFields form={cardForm} disabled={isSubmitting} />
      )}

      {selectedMethod === PaymentMethod.FPX && (
        <FPXPaymentForm
          selectedBank={fpxBankCode}
          onBankChange={onFpxBankChange}
          disabled={isSubmitting}
        />
      )}

      {selectedMethod === PaymentMethod.BANK_TRANSFER && (
        <ManualTransferFields
          form={manualForm}
          billing={billing}
          disabled={isSubmitting}
        />
      )}

      {/* Security Notice */}
      <Alert
        variant="default"
        className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
      >
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Your payment information is encrypted and secure.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !isMethodValid()}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Pay {formatCurrency(paymentAmount)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Payment Fields
// ---------------------------------------------------------------------------

function CardPaymentFields({
  form,
  disabled,
}: {
  form: ReturnType<typeof useForm<CardFormValues>>;
  disabled: boolean;
}) {
  return (
    <Form {...form}>
      <div className="space-y-3">
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
                  disabled={disabled}
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
                  disabled={disabled}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, "");
                    const formatted =
                      value.match(/.{1,4}/g)?.join(" ") || value;
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
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
                    disabled={disabled}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value =
                          value.substring(0, 2) + "/" + value.substring(2);
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Manual Transfer Fields
// ---------------------------------------------------------------------------

function ManualTransferFields({
  form,
  billing,
  disabled,
}: {
  form: ReturnType<typeof useForm<ManualFormValues>>;
  billing: Billing;
  disabled: boolean;
}) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Bank Transfer Instructions</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Please transfer the amount to:</p>
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
                <strong>Reference:</strong> {billing.billNumber}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your payment will be verified within 1-2 business days.
            </p>
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transfer Reference (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your bank transfer reference"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Processing Step
// ---------------------------------------------------------------------------

function ProcessingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold">Processing Your Payment</h3>
      <p className="text-sm text-muted-foreground">
        Please do not close this window. This may take a few moments.
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Secured by 256-bit encryption</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Step
// ---------------------------------------------------------------------------

function SuccessStep({
  amount,
  method,
  paymentId,
  billingId,
  isManual,
  onClose,
}: {
  amount: number;
  method: PaymentMethod;
  paymentId: string | null;
  billingId: string;
  isManual: boolean;
  onClose: () => void;
}) {
  const receiptUrl = paymentId
    ? `/dashboard/tenant/bills/${billingId}/receipt?paymentId=${paymentId}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">
        {isManual ? "Transfer Submitted" : "Payment Successful!"}
      </h3>
      <p className="mb-1 text-muted-foreground">
        {isManual
          ? `Your bank transfer of ${formatCurrency(amount)} has been submitted for verification.`
          : `Your payment of ${formatCurrency(amount)} has been processed.`}
      </p>
      {paymentId && (
        <p className="mb-4 text-xs text-muted-foreground">
          Reference: {paymentId}
        </p>
      )}
      {isManual && (
        <Alert className="mb-4 text-left">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your payment will be verified within 1-2 business days. You will
            receive a notification once confirmed.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex w-full gap-2">
        {receiptUrl && !isManual && (
          <Button variant="outline" className="flex-1" asChild>
            <Link href={receiptUrl}>
              <FileText className="mr-2 h-4 w-4" />
              View Receipt
            </Link>
          </Button>
        )}
        <Button onClick={onClose} className={receiptUrl && !isManual ? "flex-1" : "w-full"}>
          Done
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failed Step
// ---------------------------------------------------------------------------

function FailedStep({
  onRetry,
  onClose,
}: {
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Payment Failed</h3>
      <p className="mb-4 text-muted-foreground">
        We couldn&apos;t process your payment. Please try again or choose a
        different payment method.
      </p>
      <div className="flex w-full gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={onRetry} className="flex-1">
          Try Again
        </Button>
      </div>
    </div>
  );
}
