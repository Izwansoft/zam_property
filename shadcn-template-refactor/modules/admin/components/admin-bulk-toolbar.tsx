// =============================================================================
// AdminBulkToolbar — Bulk action toolbar for selected listings
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
import { Button } from "@/components/ui/button";
import { XIcon, Loader2Icon } from "lucide-react";
import type { BulkAction } from "../types";
import { BULK_ACTIONS } from "../types";
import {
  useAdminPublishListing,
  useAdminUnpublishListing,
  useAdminFeatureListing,
  useAdminUnfeatureListing,
} from "../hooks/admin-listings";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminBulkToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminBulkToolbar({
  selectedIds,
  onClearSelection,
}: AdminBulkToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const publishMutation = useAdminPublishListing();
  const unpublishMutation = useAdminUnpublishListing();
  const featureMutation = useAdminFeatureListing();
  const unfeatureMutation = useAdminUnfeatureListing();

  if (selectedIds.length === 0) return null;

  const handleBulkAction = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        switch (confirmAction) {
          case "publish":
            await publishMutation.mutateAsync(id);
            break;
          case "unpublish":
            await unpublishMutation.mutateAsync({ id });
            break;
          case "feature":
            await featureMutation.mutateAsync(id);
            break;
          case "unfeature":
            await unfeatureMutation.mutateAsync(id);
            break;
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsProcessing(false);
    setConfirmAction(null);

    if (failCount === 0) {
      showSuccess(
        `${successCount} listing${successCount !== 1 ? "s" : ""} updated`
      );
    } else {
      showError(
        `${successCount} succeeded, ${failCount} failed`
      );
    }

    onClearSelection();
  };

  const actionConfig = BULK_ACTIONS.find((a) => a.action === confirmAction);

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>

        {BULK_ACTIONS.map((bulk) => (
          <Button
            key={bulk.action}
            variant={bulk.variant === "destructive" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setConfirmAction(bulk.action)}
          >
            {bulk.label}
          </Button>
        ))}

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <XIcon className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Bulk Confirmation */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionConfig?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              This will {confirmAction} {selectedIds.length} listing
              {selectedIds.length !== 1 ? "s" : ""}. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={isProcessing}
              className={
                actionConfig?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isProcessing && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
