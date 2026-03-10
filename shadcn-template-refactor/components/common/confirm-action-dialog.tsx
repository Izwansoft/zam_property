// =============================================================================
// ConfirmActionDialog — Reusable confirmation dialog with optional reason field
// =============================================================================

"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  /** If true, shows a text input for a reason and passes it to onConfirm */
  requiresReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  isPending?: boolean;
  onConfirm: (reason?: string) => void;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  requiresReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
  isPending = false,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(requiresReason ? reason : undefined);
    setReason("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setReason("");
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {requiresReason && (
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-reason">{reasonLabel}</Label>
            <Input
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || (requiresReason && !reason.trim())}
            className={
              confirmVariant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isPending ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
