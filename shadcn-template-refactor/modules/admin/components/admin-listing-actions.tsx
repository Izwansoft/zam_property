// =============================================================================
// AdminListingActions — Action dropdown + confirmation dialogs
// =============================================================================

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontalIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  ArchiveIcon,
  StarIcon,
  StarOffIcon,
} from "lucide-react";
import type { AdminListing, AdminListingAction } from "../types";
import { ADMIN_LISTING_ACTIONS } from "../types";
import {
  useAdminPublishListing,
  useAdminUnpublishListing,
  useAdminExpireListing,
  useAdminArchiveListing,
  useAdminFeatureListing,
  useAdminUnfeatureListing,
} from "../hooks/admin-listings";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminListingActionsProps {
  listing: AdminListing;
}

// ---------------------------------------------------------------------------
// Action icons
// ---------------------------------------------------------------------------

const ACTION_ICONS: Record<AdminListingAction, React.ReactNode> = {
  publish: <CheckCircle2Icon className="mr-2 h-4 w-4" />,
  unpublish: <XCircleIcon className="mr-2 h-4 w-4" />,
  expire: <ClockIcon className="mr-2 h-4 w-4" />,
  archive: <ArchiveIcon className="mr-2 h-4 w-4" />,
  feature: <StarIcon className="mr-2 h-4 w-4" />,
  unfeature: <StarOffIcon className="mr-2 h-4 w-4" />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminListingActions({ listing }: AdminListingActionsProps) {
  const [confirmAction, setConfirmAction] = useState<
    (typeof ADMIN_LISTING_ACTIONS)[number] | null
  >(null);
  const [reason, setReason] = useState("");

  const publishMutation = useAdminPublishListing();
  const unpublishMutation = useAdminUnpublishListing();
  const expireMutation = useAdminExpireListing();
  const archiveMutation = useAdminArchiveListing();
  const featureMutation = useAdminFeatureListing();
  const unfeatureMutation = useAdminUnfeatureListing();

  // Determine which actions are available based on current status
  const getAvailableActions = () => {
    const actions: AdminListingAction[] = [];

    switch (listing.status) {
      case "DRAFT":
        actions.push("publish", "archive");
        break;
      case "PUBLISHED":
        actions.push("unpublish", "expire", "archive");
        break;
      case "EXPIRED":
        actions.push("publish", "archive");
        break;
      case "ARCHIVED":
        actions.push("publish");
        break;
    }

    // Feature/unfeature is always available for published listings
    if (listing.status === "PUBLISHED") {
      actions.push(listing.isFeatured ? "unfeature" : "feature");
    }

    return actions;
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.action) {
        case "publish":
          await publishMutation.mutateAsync(listing.id);
          break;
        case "unpublish":
          await unpublishMutation.mutateAsync({
            id: listing.id,
            reason: reason || undefined,
          });
          break;
        case "expire":
          await expireMutation.mutateAsync({
            id: listing.id,
            reason: reason || undefined,
          });
          break;
        case "archive":
          await archiveMutation.mutateAsync({
            id: listing.id,
            reason: reason || undefined,
          });
          break;
        case "feature":
          await featureMutation.mutateAsync(listing.id);
          break;
        case "unfeature":
          await unfeatureMutation.mutateAsync(listing.id);
          break;
      }
      showSuccess(`Listing ${confirmAction.label.toLowerCase()}ed successfully`);
    } catch {
      showError(`Failed to ${confirmAction.label.toLowerCase()} listing`);
    } finally {
      setConfirmAction(null);
      setReason("");
    }
  };

  const availableActions = getAvailableActions();

  const statusActions = availableActions.filter(
    (a) => a !== "feature" && a !== "unfeature"
  );
  const featureActions = availableActions.filter(
    (a) => a === "feature" || a === "unfeature"
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {statusActions.map((actionKey) => {
            const actionConfig = ADMIN_LISTING_ACTIONS.find(
              (a) => a.action === actionKey
            );
            if (!actionConfig) return null;
            return (
              <DropdownMenuItem
                key={actionKey}
                onClick={() => setConfirmAction(actionConfig)}
                className={
                  actionConfig.variant === "destructive"
                    ? "text-destructive focus:text-destructive"
                    : ""
                }
              >
                {ACTION_ICONS[actionKey]}
                {actionConfig.label}
              </DropdownMenuItem>
            );
          })}
          {featureActions.length > 0 && statusActions.length > 0 && (
            <DropdownMenuSeparator />
          )}
          {featureActions.map((actionKey) => {
            const actionConfig = ADMIN_LISTING_ACTIONS.find(
              (a) => a.action === actionKey
            );
            if (!actionConfig) return null;
            return (
              <DropdownMenuItem
                key={actionKey}
                onClick={() => setConfirmAction(actionConfig)}
              >
                {ACTION_ICONS[actionKey]}
                {actionConfig.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.label} Listing
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
              <br />
              <strong className="text-foreground">{listing.title}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction?.requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="action-reason">Reason (optional)</Label>
              <Textarea
                id="action-reason"
                placeholder="Enter a reason for this action..."
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
              className={
                confirmAction?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
