// =============================================================================
// ListingActions — Status actions for listing detail page
// =============================================================================
// Edit, Publish, Unpublish, Archive, Delete with confirmation dialogs.
// Status workflow: DRAFT → PUBLISHED → EXPIRED/ARCHIVED
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Globe,
  GlobeLock,
  Archive,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
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
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { ListingDetail, ListingStatus } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingActionsProps {
  listing: ListingDetail;
  /** Portal type affects which actions are shown */
  portal: "vendor" | "partner";
  /** Base path for edit link */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfirmAction = "publish" | "unpublish" | "archive" | "delete" | null;

const ACTION_CONFIG: Record<
  NonNullable<ConfirmAction>,
  {
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
  }
> = {
  publish: {
    title: "Publish Listing",
    description:
      "This listing will be visible to the public. Make sure all required fields are filled before publishing.",
    confirmLabel: "Publish",
    variant: "default",
  },
  unpublish: {
    title: "Unpublish Listing",
    description:
      "This listing will be hidden from the public. You can re-publish it later.",
    confirmLabel: "Unpublish",
    variant: "default",
  },
  archive: {
    title: "Archive Listing",
    description:
      "This listing will be archived and hidden from public view. This action can be undone.",
    confirmLabel: "Archive",
    variant: "destructive",
  },
  delete: {
    title: "Delete Listing",
    description:
      "This listing will be permanently deleted. This action cannot be undone.",
    confirmLabel: "Delete",
    variant: "destructive",
  },
};

// ---------------------------------------------------------------------------
// Available actions per status
// ---------------------------------------------------------------------------

function getAvailableActions(
  status: ListingStatus,
  portal: "vendor" | "partner"
): ConfirmAction[] {
  const actions: ConfirmAction[] = [];

  switch (status) {
    case "DRAFT":
      actions.push("publish", "delete");
      break;
    case "PUBLISHED":
      actions.push("unpublish", "archive");
      break;
    case "EXPIRED":
      actions.push("publish", "archive", "delete");
      break;
    case "ARCHIVED":
      actions.push("publish", "delete");
      break;
  }

  // Partner admins can also archive published listings
  if (portal === "partner" && status === "PUBLISHED" && !actions.includes("archive")) {
    actions.push("archive");
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingActions({
  listing,
  portal,
  basePath,
}: ListingActionsProps) {
  const router = useRouter();
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const availableActions = getAvailableActions(listing.status, portal);
  const canEdit = listing.status === "DRAFT" || listing.status === "PUBLISHED";

  // Publish mutation
  const publishMutation = useApiMutation<ListingDetail, void>({
    path: `/listings/${listing.id}/publish`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.listings.all(partnerKey),
      queryKeys.listings.detail(partnerKey, listing.id),
    ],
    onSuccess: () => {
      showSuccess("Listing published successfully");
      setConfirmAction(null);
    },
    onError: (error) => {
      showError(error.message || "Failed to publish listing");
      setConfirmAction(null);
    },
  });

  // Unpublish mutation
  const unpublishMutation = useApiMutation<ListingDetail, void>({
    path: `/listings/${listing.id}/unpublish`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.listings.all(partnerKey),
      queryKeys.listings.detail(partnerKey, listing.id),
    ],
    onSuccess: () => {
      showSuccess("Listing unpublished");
      setConfirmAction(null);
    },
    onError: (error) => {
      showError(error.message || "Failed to unpublish listing");
      setConfirmAction(null);
    },
  });

  // Archive mutation
  const archiveMutation = useApiMutation<ListingDetail, void>({
    path: `/listings/${listing.id}/archive`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.listings.all(partnerKey),
      queryKeys.listings.detail(partnerKey, listing.id),
    ],
    onSuccess: () => {
      showSuccess("Listing archived");
      setConfirmAction(null);
    },
    onError: (error) => {
      showError(error.message || "Failed to archive listing");
      setConfirmAction(null);
    },
  });

  // Delete mutation
  const deleteMutation = useApiMutation<void, void>({
    path: `/listings/${listing.id}`,
    method: "DELETE",
    invalidateKeys: [queryKeys.listings.all(partnerKey)],
    onSuccess: () => {
      showSuccess("Listing deleted");
      setConfirmAction(null);
      // Navigate back to listings
      router.push(`${basePath}`);
    },
    onError: (error) => {
      showError(error.message || "Failed to delete listing");
      setConfirmAction(null);
    },
  });

  const handleConfirm = () => {
    switch (confirmAction) {
      case "publish":
        publishMutation.mutate(undefined as unknown as void);
        break;
      case "unpublish":
        unpublishMutation.mutate(undefined as unknown as void);
        break;
      case "archive":
        archiveMutation.mutate(undefined as unknown as void);
        break;
      case "delete":
        deleteMutation.mutate(undefined as unknown as void);
        break;
    }
  };

  const isLoading =
    publishMutation.isPending ||
    unpublishMutation.isPending ||
    archiveMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Primary action: Edit */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${basePath}/${listing.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}

        {/* Publish button (primary action for drafts) */}
        {availableActions.includes("publish") && (
          <Button
            size="sm"
            onClick={() => setConfirmAction("publish")}
            disabled={isLoading}
          >
            {publishMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        )}

        {/* More actions dropdown */}
        {availableActions.filter((a) => a !== "publish").length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableActions.includes("unpublish") && (
                <DropdownMenuItem onClick={() => setConfirmAction("unpublish")}>
                  <GlobeLock className="mr-2 h-4 w-4" />
                  Unpublish
                </DropdownMenuItem>
              )}
              {availableActions.includes("archive") && (
                <DropdownMenuItem onClick={() => setConfirmAction("archive")}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {(availableActions.includes("unpublish") ||
                availableActions.includes("archive")) &&
                availableActions.includes("delete") && <DropdownMenuSeparator />}
              {availableActions.includes("delete") && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        {confirmAction && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {ACTION_CONFIG[confirmAction].title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {ACTION_CONFIG[confirmAction].description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={isLoading}
                className={
                  ACTION_CONFIG[confirmAction].variant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {ACTION_CONFIG[confirmAction].confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}
