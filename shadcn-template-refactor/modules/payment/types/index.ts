// =============================================================================
// Payment Types — Session 6.3
// =============================================================================
// Types for payment creation flow, payment intents, and payment status polling.
// Backend: POST /api/v1/rent-payments (create intent)
// Backend: GET /api/v1/rent-payments/:id (poll status)
// =============================================================================

import { PaymentMethod, PaymentStatus } from "@/modules/billing/types";

// Re-export for convenience
export { PaymentMethod, PaymentStatus };

// ---------------------------------------------------------------------------
// Payment Intent — Response from POST /api/v1/rent-payments
// ---------------------------------------------------------------------------

/**
 * PaymentIntent returned from the backend when initiating a payment.
 * For card/FPX, contains a clientSecret for Stripe integration.
 * For manual bank transfer, contains bank details and reference.
 */
export interface PaymentIntent {
  id: string;
  billingId: string;
  paymentNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  /** Stripe client secret for card/FPX payments */
  clientSecret?: string;
  /** Redirect URL for FPX bank auth */
  redirectUrl?: string;
  /** Bank transfer details for manual payments */
  bankDetails?: BankTransferDetails;
  /** Reference code for the payment */
  reference?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Bank Transfer Details (for manual payments)
// ---------------------------------------------------------------------------

export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string;
  reference: string;
}

// ---------------------------------------------------------------------------
// Create Payment DTO — POST /api/v1/rent-payments
// ---------------------------------------------------------------------------

export interface CreatePaymentDto {
  billingId: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
  /** FPX bank code (required for FPX method) */
  bankCode?: string;
  /** Manual transfer reference number */
  referenceNumber?: string;
}

// ---------------------------------------------------------------------------
// Payment Status Response
// ---------------------------------------------------------------------------

export interface PaymentStatusResponse {
  id: string;
  billingId: string;
  paymentNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string | null;
  receiptNumber?: string | null;
  receiptUrl?: string | null;
  paymentDate?: string | null;
  processedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Payment Dialog State
// ---------------------------------------------------------------------------

export type PaymentDialogStep =
  | "amount"
  | "method"
  | "processing"
  | "success"
  | "failed";

// ---------------------------------------------------------------------------
// FPX Bank List (Malaysian banks supported by payment gateway)
// ---------------------------------------------------------------------------

export interface FPXBank {
  code: string;
  name: string;
  /** Whether the bank is currently available */
  available?: boolean;
}

export const FPX_BANKS: FPXBank[] = [
  { code: "MBB", name: "Maybank", available: true },
  { code: "CIMB", name: "CIMB Bank", available: true },
  { code: "PBB", name: "Public Bank", available: true },
  { code: "RHB", name: "RHB Bank", available: true },
  { code: "HLB", name: "Hong Leong Bank", available: true },
  { code: "AMB", name: "AmBank", available: true },
  { code: "BOCM", name: "Bank of China", available: true },
  { code: "BIMB", name: "Bank Islam", available: true },
  { code: "BMMB", name: "Bank Muamalat", available: true },
  { code: "BSN", name: "BSN", available: true },
  { code: "HSBC", name: "HSBC Bank", available: true },
  { code: "OCBC", name: "OCBC Bank", available: true },
  { code: "SCB", name: "Standard Chartered", available: true },
  { code: "UOB", name: "UOB Bank", available: true },
];

// ---------------------------------------------------------------------------
// Payment method display config
// ---------------------------------------------------------------------------

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    method: PaymentMethod.CARD,
    label: "Credit/Debit Card",
    description: "Visa, Mastercard",
    icon: "credit-card",
  },
  {
    method: PaymentMethod.FPX,
    label: "FPX Online Banking",
    description: "Malaysian banks",
    icon: "building-2",
  },
  {
    method: PaymentMethod.BANK_TRANSFER,
    label: "Bank Transfer",
    description: "Manual transfer",
    icon: "receipt",
  },
];
