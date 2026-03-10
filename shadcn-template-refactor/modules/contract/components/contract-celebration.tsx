// =============================================================================
// ContractCelebration — Success celebration for fully executed contracts
// =============================================================================
// Shows a celebration animation when all parties have signed the contract.
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Home, PartyPopper, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContractCelebrationProps {
  /** Whether to show the celebration */
  open: boolean;
  /** Callback when celebration is dismissed */
  onOpenChange?: (open: boolean) => void;
  /** Contract title */
  contractTitle?: string;
  /** Property address */
  propertyAddress?: string;
  /** URL to download the signed contract */
  downloadUrl?: string;
  /** Tenancy ID for navigation */
  tenancyId?: string;
  /** Auto-dismiss after N milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
}

// ---------------------------------------------------------------------------
// Confetti Animation Component
// ---------------------------------------------------------------------------

function Confetti() {
  const colors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-orange-500",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute h-2 w-2 rounded-full opacity-80",
            colors[i % colors.length]
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 10}%`,
            animation: `confetti-fall ${2 + Math.random() * 2}s linear ${
              Math.random() * 0.5
            }s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContractCelebration Component
// ---------------------------------------------------------------------------

export function ContractCelebration({
  open,
  onOpenChange,
  contractTitle = "Tenancy Agreement",
  propertyAddress,
  downloadUrl,
  tenancyId,
  autoDismissMs = 0,
}: ContractCelebrationProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when dialog opens
  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-dismiss
  useEffect(() => {
    if (open && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onOpenChange?.(false);
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [open, autoDismissMs, onOpenChange]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleViewTenancy = () => {
    onOpenChange?.(false);
    if (tenancyId) {
      router.push(`/dashboard/tenant/tenancy/${tenancyId}`);
    }
  };

  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {showConfetti && <Confetti />}

        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <div className="relative">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
          </div>

          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <PartyPopper className="h-6 w-6 text-yellow-500" />
            Contract Executed!
            <PartyPopper className="h-6 w-6 text-yellow-500" />
          </DialogTitle>

          <DialogDescription className="text-center">
            Congratulations! All parties have signed the contract.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-4 text-center">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              {contractTitle}
            </h4>
            {propertyAddress && (
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                {propertyAddress}
              </p>
            )}
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              Your tenancy is now officially active!
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              All signatures collected
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Contract is legally binding
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Tenancy status updated to Active
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {downloadUrl && (
            <Button className="w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Signed Contract
            </Button>
          )}
          {tenancyId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewTenancy}
            >
              <Home className="mr-2 h-4 w-4" />
              View My Tenancy
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ContractCelebration;
