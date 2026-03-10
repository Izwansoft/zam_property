// =============================================================================
// ReceiptDownload — PDF download button for payment receipts
// =============================================================================
// Generates a client-side PDF receipt using the browser print-to-PDF flow
// or fetches a pre-generated receipt URL from the backend.
// =============================================================================

"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PaymentStatusResponse } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReceiptDownloadProps {
  /** The payment record with receipt info */
  payment: PaymentStatusResponse;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom label */
  label?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Download button for payment receipts.
 * If the backend provides a receiptUrl, it opens that directly.
 * Otherwise, it triggers the browser print dialog for PDF saving.
 */
export function ReceiptDownload({
  payment,
  className,
  variant = "default",
  size = "default",
  label = "Download Receipt",
}: ReceiptDownloadProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = React.useCallback(async () => {
    setIsDownloading(true);

    try {
      if (payment.receiptUrl && payment.receiptUrl !== "#") {
        // Backend-provided receipt URL — open in new tab for download
        window.open(payment.receiptUrl, "_blank", "noopener,noreferrer");
      } else {
        // Fallback: use browser print dialog for PDF saving
        window.print();
      }
    } finally {
      // Small delay to prevent button flickering
      setTimeout(() => setIsDownloading(false), 500);
    }
  }, [payment.receiptUrl]);

  const hasReceipt =
    payment.receiptNumber || payment.receiptUrl;

  if (!hasReceipt && payment.status !== "COMPLETED") {
    return null; // No receipt available for non-completed payments
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
