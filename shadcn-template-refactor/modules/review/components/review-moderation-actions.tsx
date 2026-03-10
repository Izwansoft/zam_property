// =============================================================================
// ReviewModerationActions — Approve, Reject, Flag actions for admins
// =============================================================================

"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Flag,
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

import type { ReviewStatus } from "../types";
import { useApproveReview, useRejectReview, useFlagReview } from "../hooks/use-review-mutations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModerationAction = "approve" | "reject" | "flag";

const ACTION_CONFIG: Record<
  ModerationAction,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "destructive" | "outline";
    requiresReason: boolean;
  }
> = {
  approve: {
    label: "Approve",
    description: "This review will be visible to the public.",
    icon: CheckCircle,
    variant: "default",
    requiresReason: false,
  },
  reject: {
    label: "Reject",
    description: "This review will be hidden from public view. A reason is required.",
    icon: XCircle,
    variant: "destructive",
    requiresReason: true,
  },
  flag: {
    label: "Flag",
    description: "This review will be flagged for further attention. A reason is required.",
    icon: Flag,
    variant: "outline",
    requiresReason: true,
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewModerationActionsProps {
  reviewId: string;
  currentStatus: ReviewStatus;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewModerationActions({
  reviewId,
  currentStatus,
}: ReviewModerationActionsProps) {
  const [openAction, setOpenAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState("");

  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();
  const flagMutation = useFlagReview();

  const isAnyLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    flagMutation.isPending;

  // Determine available actions based on current status
  const availableActions: ModerationAction[] = [];
  if (currentStatus !== "APPROVED") availableActions.push("approve");
  if (currentStatus !== "REJECTED") availableActions.push("reject");
  if (currentStatus !== "FLAGGED") availableActions.push("flag");

  const handleConfirm = () => {
    if (!openAction) return;

    switch (openAction) {
      case "approve":
        approveMutation.mutate(
          { id: reviewId },
          { onSuccess: () => setOpenAction(null) },
        );
        break;
      case "reject":
        rejectMutation.mutate(
          { id: reviewId, reason },
          { onSuccess: () => { setOpenAction(null); setReason(""); } },
        );
        break;
      case "flag":
        flagMutation.mutate(
          { id: reviewId, reason },
          { onSuccess: () => { setOpenAction(null); setReason(""); } },
        );
        break;
    }
  };

  if (availableActions.length === 0) return null;

  const activeConfig = openAction ? ACTION_CONFIG[openAction] : null;

  return (
    <>
      <div className="flex items-center gap-2">
        {availableActions.map((action) => {
          const config = ACTION_CONFIG[action];
          const Icon = config.icon;
          const isPending =
            (action === "approve" && approveMutation.isPending) ||
            (action === "reject" && rejectMutation.isPending) ||
            (action === "flag" && flagMutation.isPending);

          return (
            <Button
              key={action}
              variant={config.variant}
              size="sm"
              disabled={isAnyLoading}
              onClick={() => setOpenAction(action)}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!openAction}
        onOpenChange={(open) => {
          if (!open) {
            setOpenAction(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeConfig?.label} Review
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeConfig?.requiresReason && (
            <div className="space-y-2 py-2">
              <Label htmlFor="moderation-reason">Reason</Label>
              <Textarea
                id="moderation-reason"
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={
                (activeConfig?.requiresReason && !reason.trim()) ||
                isAnyLoading
              }
            >
              {isAnyLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm {activeConfig?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
