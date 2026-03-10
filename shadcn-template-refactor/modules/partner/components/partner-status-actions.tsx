// =============================================================================
// PartnerStatusActions — Suspend, Reactivate, Deactivate with confirmations
// =============================================================================
// Status workflow: ACTIVE → SUSPENDED ↔ REACTIVATED, ACTIVE/SUSPENDED → DEACTIVATED
// Destructive actions require confirmation + reason.
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldBan,
  ShieldCheck,
  Power,
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

import { PartnerStatus, type PartnerDetail } from "../types";
import {
  useSuspendPartner,
  useReactivatePartner,
  useDeactivatePartner,
} from "../hooks/use-partner-mutations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfirmAction = "suspend" | "reactivate" | "deactivate" | null;

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
  suspend: {
    title: "Suspend Partner",
    description:
      "This partner will be suspended. All their listings will become hidden and vendors will lose access. The partner admin will be notified.",
    confirmLabel: "Suspend",
    variant: "destructive",
    requiresReason: true,
    reasonLabel: "Suspension Reason",
    reasonPlaceholder: "Explain why this partner is being suspended...",
  },
  reactivate: {
    title: "Reactivate Partner",
    description:
      "This partner will be reactivated. All their vendors and listings will regain access. Are you sure?",
    confirmLabel: "Reactivate",
    variant: "default",
    requiresReason: false,
    reasonLabel: "",
    reasonPlaceholder: "",
  },
  deactivate: {
    title: "Deactivate Partner",
    description:
      "This will permanently deactivate the partner. All data will be archived and access will be removed. This action is difficult to reverse.",
    confirmLabel: "Deactivate",
    variant: "destructive",
    requiresReason: true,
    reasonLabel: "Deactivation Reason",
    reasonPlaceholder: "Explain why this partner is being deactivated...",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerStatusActionsProps {
  partner: PartnerDetail;
  /** Optional additional actions/links to render on the right side */
  endSlot?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerStatusActions({ partner, endSlot }: PartnerStatusActionsProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suspendMutation = useSuspendPartner();
  const reactivateMutation = useReactivatePartner();
  const deactivateMutation = useDeactivatePartner();

  // Determine which actions are available based on status
  const canSuspend = partner.status === PartnerStatus.ACTIVE;
  const canReactivate = partner.status === PartnerStatus.SUSPENDED;
  const canDeactivate =
    partner.status === PartnerStatus.ACTIVE ||
    partner.status === PartnerStatus.SUSPENDED;

  const showActions = canSuspend || canReactivate || canDeactivate;

  if (!showActions) return null;

  const handleConfirm = async () => {
    if (!confirmAction) return;

    const config = ACTION_CONFIG[confirmAction];
    if (config.requiresReason && !reason.trim()) return;

    setIsSubmitting(true);

    try {
      switch (confirmAction) {
        case "suspend":
          await suspendMutation.mutateAsync({
            id: partner.id,
            reason: reason.trim(),
          });
          showSuccess(`${partner.name} has been suspended.`);
          break;
        case "reactivate":
          await reactivateMutation.mutateAsync(partner.id);
          showSuccess(`${partner.name} has been reactivated.`);
          break;
        case "deactivate":
          await deactivateMutation.mutateAsync({
            id: partner.id,
            reason: reason.trim(),
          });
          showSuccess(`${partner.name} has been deactivated.`);
          break;
      }

      setConfirmAction(null);
      setReason("");
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
      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Actions
          </span>
          <div className="h-4 w-px bg-border" />

          {canReactivate && (
            <Button
              size="sm"
              onClick={() => setConfirmAction("reactivate")}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Reactivate
            </Button>
          )}

          {canSuspend && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction("suspend")}
            >
              <ShieldBan className="mr-1.5 h-4 w-4" />
              Suspend
            </Button>
          )}

          {canDeactivate && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmAction("deactivate")}
            >
              <Power className="mr-1.5 h-4 w-4" />
              Deactivate
            </Button>
          )}
        </div>

        {/* End slot for additional actions like audit history */}
        {endSlot && <div className="flex items-center">{endSlot}</div>}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={handleOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {currentConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Reason input (for destructive actions) */}
          {currentConfig?.requiresReason && (
            <div className="space-y-2 py-2">
              <Label htmlFor="action-reason">{currentConfig.reasonLabel}</Label>
              <Textarea
                id="action-reason"
                placeholder={currentConfig.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
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
