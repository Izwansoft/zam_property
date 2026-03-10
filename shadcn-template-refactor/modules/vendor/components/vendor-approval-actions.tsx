// =============================================================================
// VendorApprovalActions — Approve, Reject, Suspend with confirmations
// =============================================================================
// Status workflow: PENDING → APPROVED/REJECTED → SUSPENDED
// Destructive actions require confirmation + reason.
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ShieldBan,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { VendorDetail } from "../types";
import {
  useApproveVendor,
  useRejectVendor,
  useSuspendVendor,
} from "../hooks/use-vendor-mutations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfirmAction = "approve" | "reject" | "suspend" | null;

const ACTION_CONFIG: Record<
  NonNullable<ConfirmAction>,
  {
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
    requiresReason: boolean;
    reasonLabel: string;
    reasonPlaceholder: string;
  }
> = {
  approve: {
    title: "Approve Vendor",
    description:
      "This vendor will be approved and can start creating listings. Are you sure?",
    confirmLabel: "Approve",
    variant: "default",
    requiresReason: false,
    reasonLabel: "",
    reasonPlaceholder: "",
  },
  reject: {
    title: "Reject Vendor",
    description:
      "This vendor application will be rejected. The vendor will see the rejection reason. This action cannot be undone.",
    confirmLabel: "Reject",
    variant: "destructive",
    requiresReason: true,
    reasonLabel: "Rejection Reason",
    reasonPlaceholder: "Explain why this vendor application is being rejected...",
  },
  suspend: {
    title: "Suspend Vendor",
    description:
      "This vendor will be suspended and their listings will become hidden. The vendor will see the suspension reason.",
    confirmLabel: "Suspend",
    variant: "destructive",
    requiresReason: true,
    reasonLabel: "Suspension Reason",
    reasonPlaceholder: "Explain why this vendor is being suspended...",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorApprovalActionsProps {
  vendor: VendorDetail;
  portal: "partner" | "platform";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorApprovalActions({
  vendor,
  portal,
}: VendorApprovalActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approveMutation = useApproveVendor();
  const rejectMutation = useRejectVendor();
  const suspendMutation = useSuspendVendor();

  // Determine which actions are available based on status
  const canApprove = vendor.status === "PENDING";
  const canReject = vendor.status === "PENDING";
  const canSuspend = vendor.status === "APPROVED";

  const showActions = canApprove || canReject || canSuspend;

  if (!showActions) return null;

  const handleConfirm = async () => {
    if (!confirmAction) return;

    const config = ACTION_CONFIG[confirmAction];
    if (config.requiresReason && !reason.trim()) return;

    setIsSubmitting(true);

    try {
      switch (confirmAction) {
        case "approve":
          await approveMutation.mutateAsync(vendor.id);
          showSuccess(`${vendor.name} has been approved.`);
          break;
        case "reject":
          await rejectMutation.mutateAsync({
            id: vendor.id,
            reason: reason.trim(),
          });
          showSuccess(`${vendor.name} has been rejected.`);
          break;
        case "suspend":
          await suspendMutation.mutateAsync({
            id: vendor.id,
            reason: reason.trim(),
          });
          showSuccess(`${vendor.name} has been suspended.`);
          break;
      }

      setConfirmAction(null);
      setReason("");
      // Refresh the page to show updated status
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Operation failed";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmAction(null);
      setReason("");
    }
  };

  const currentConfig = confirmAction ? ACTION_CONFIG[confirmAction] : null;

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          Actions:
        </span>

        {canApprove && (
          <Button
            size="sm"
            onClick={() => setConfirmAction("approve")}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Approve
          </Button>
        )}

        {canReject && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmAction("reject")}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
        )}

        {canSuspend && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction("suspend")}
            className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
          >
            <ShieldBan className="mr-1.5 h-4 w-4" />
            Suspend
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={handleOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Reason text area (for reject/suspend) */}
          {currentConfig?.requiresReason && (
            <div className="space-y-2 py-2">
              <Label htmlFor="action-reason">
                {currentConfig.reasonLabel}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={currentConfig.reasonPlaceholder}
                rows={3}
                className="resize-none"
              />
              {reason.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">
                  A reason is required for this action.
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={
                isSubmitting ||
                (currentConfig?.requiresReason && !reason.trim())
              }
              className={
                currentConfig?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isSubmitting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {currentConfig?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
