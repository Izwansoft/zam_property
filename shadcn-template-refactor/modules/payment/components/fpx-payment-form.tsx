// =============================================================================
// FPXPaymentForm — Malaysian FPX bank selection form
// =============================================================================
// Shows a list of Malaysian banks for FPX online banking payment.
// The user selects a bank and is redirected to the bank's secure login.
// =============================================================================

"use client";

import { Building2, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

import { FPX_BANKS } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FPXPaymentFormProps {
  /** Currently selected bank code */
  selectedBank: string;
  /** Callback when bank changes */
  onBankChange: (bankCode: string) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FPXPaymentForm({
  selectedBank,
  onBankChange,
  disabled = false,
}: FPXPaymentFormProps) {
  const availableBanks = FPX_BANKS.filter((b) => b.available !== false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Your Bank</Label>
        <Select
          value={selectedBank}
          onValueChange={onBankChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a bank" />
          </SelectTrigger>
          <SelectContent>
            {availableBanks.map((bank) => (
              <SelectItem key={bank.code} value={bank.code}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{bank.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>FPX Online Banking</AlertTitle>
        <AlertDescription>
          You will be redirected to your bank&apos;s secure login page to
          complete the payment. Please ensure you have your banking credentials
          ready.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FPX Bank Option Item (for inline display variant)
// ---------------------------------------------------------------------------

interface FPXBankOptionProps {
  bankCode: string;
  bankName: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function FPXBankOption({
  bankCode,
  bankName,
  selected,
  onClick,
  disabled = false,
}: FPXBankOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <Building2
        className={cn(
          "h-4 w-4",
          selected ? "text-primary" : "text-muted-foreground"
        )}
      />
      <div>
        <p className="text-sm font-medium">{bankName}</p>
        <p className="text-xs text-muted-foreground">{bankCode}</p>
      </div>
    </button>
  );
}
