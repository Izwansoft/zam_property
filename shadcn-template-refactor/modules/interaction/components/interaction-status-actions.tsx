// =============================================================================
// InteractionStatusActions — Status transitions with confirmation dialogs
// =============================================================================
// Shows only valid transitions based on current status.
// All transitions go through PATCH /interactions/:id/status.
// =============================================================================

"use client";

import { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Ban,
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
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { InteractionDetail, InteractionStatus } from "../types";
import { VALID_STATUS_TRANSITIONS } from "../types";
import { useUpdateInteractionStatus } from "../hooks/use-interaction-mutations";
import { STATUS_TRANSITION_LABELS } from "../utils";

// ---------------------------------------------------------------------------
// Transition button config
// ---------------------------------------------------------------------------

const TRANSITION_CONFIG: Record<
  InteractionStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "destructive" | "outline" | "secondary";
  }
> = {
  NEW: { icon: MessageSquare, variant: "default" },
  CONTACTED: { icon: MessageSquare, variant: "default" },
  CONFIRMED: { icon: CheckCircle2, variant: "default" },
  CLOSED: { icon: XCircle, variant: "outline" },
  INVALID: { icon: Ban, variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionStatusActionsProps {
  interaction: InteractionDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionStatusActions({
  interaction,
}: InteractionStatusActionsProps) {
  const [confirmTarget, setConfirmTarget] = useState<InteractionStatus | null>(
    null,
  );
  const updateStatus = useUpdateInteractionStatus();

  const validTransitions = VALID_STATUS_TRANSITIONS[interaction.status] ?? [];

  if (validTransitions.length === 0) return null;

  const handleConfirm = () => {
    if (!confirmTarget) return;

    updateStatus.mutate(
      { id: interaction.id, status: confirmTarget },
      {
        onSuccess: () => {
          showSuccess(
            `Interaction marked as ${STATUS_TRANSITION_LABELS[confirmTarget].label.toLowerCase()}`,
          );
          setConfirmTarget(null);
        },
        onError: (error) => {
          showError(
            error.message || "Failed to update status. Please try again.",
          );
        },
      },
    );
  };

  const targetConfig = confirmTarget
    ? TRANSITION_CONFIG[confirmTarget]
    : null;
  const targetLabel = confirmTarget
    ? STATUS_TRANSITION_LABELS[confirmTarget]
    : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {validTransitions.map((status) => {
          const config = TRANSITION_CONFIG[status];
          const label = STATUS_TRANSITION_LABELS[status];
          const Icon = config.icon;

          return (
            <Button
              key={status}
              variant={config.variant}
              size="sm"
              onClick={() => setConfirmTarget(status)}
              disabled={updateStatus.isPending}
            >
              <Icon className="mr-1.5 h-4 w-4" />
              {label.label}
            </Button>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{targetLabel?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {targetLabel?.description}. This action will update the interaction
              status from{" "}
              <strong>{interaction.status}</strong> to{" "}
              <strong>{confirmTarget}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatus.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={updateStatus.isPending}
              className={
                targetConfig?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {updateStatus.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {targetLabel?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
