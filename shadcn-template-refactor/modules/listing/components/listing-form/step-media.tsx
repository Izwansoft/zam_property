// =============================================================================
// Step 4: Media Upload — Drag-and-drop uploader + gallery
// =============================================================================
// Integrates MediaUploader (for new uploads) and MediaGallery (for managing
// existing media) with the listing form's mediaIds field.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Info } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import {
  MediaUploader,
  MediaGallery,
  MediaGallerySkeleton,
  useReorderMedia,
  useSetPrimaryMedia,
  useDeleteMedia,
  MEDIA_CONSTRAINTS,
  type MediaGalleryItem,
} from "@/modules/media";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { ListingFormValues } from "./listing-form-schema";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StepMediaProps {
  /** Owner type for media uploads */
  ownerType?: string;
  /** Owner ID (listing ID for edit, temp ID for create) */
  ownerId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepMedia({ ownerType = "listing", ownerId = "draft" }: StepMediaProps) {
  const form = useFormContext<ListingFormValues>();
  const mediaIds = form.watch("mediaIds") ?? [];

  // Gallery items built from mediaIds (minimal mock representation)
  // In production, these would come from a query or be passed from parent
  const [galleryItems, setGalleryItems] = useState<MediaGalleryItem[]>([]);

  // Mutations
  const reorderMutation = useReorderMedia();
  const setPrimaryMutation = useSetPrimaryMedia();
  const deleteMutation = useDeleteMedia();

  // Track total count for upload limit
  const totalCount = mediaIds.length + galleryItems.filter((g) => !mediaIds.includes(g.id)).length;

  // ---- Upload complete callback ----

  const handleUploadComplete = useCallback(
    (mediaId: string) => {
      // Add the confirmed media ID to the form
      const current = form.getValues("mediaIds") ?? [];
      if (!current.includes(mediaId)) {
        const updated = [...current, mediaId];
        form.setValue("mediaIds", updated, { shouldDirty: true });

        // Add to gallery items for display
        setGalleryItems((prev) => [
          ...prev,
          {
            id: mediaId,
            url: `https://cdn.example.com/media/${mediaId}`,
            thumbnailUrl: `https://cdn.example.com/media/thumb/${mediaId}`,
            filename: `uploaded-${mediaId.slice(-6)}.jpg`,
            mimeType: "image/jpeg",
            size: 1_000_000,
            mediaType: "IMAGE",
            sortOrder: prev.length,
            isPrimary: prev.length === 0 && current.length === 0,
            altText: undefined,
          },
        ]);

        showSuccess("File uploaded successfully.");
      }
    },
    [form]
  );

  // ---- Gallery actions ----

  const handleReorder = useCallback(
    (reordered: MediaGalleryItem[]) => {
      setGalleryItems(reordered);

      // Update form mediaIds in new order
      const newIds = reordered.map((item) => item.id);
      form.setValue("mediaIds", newIds, { shouldDirty: true });

      // Notify backend
      reorderMutation.mutate(
        { mediaIds: newIds },
        {
          onError: () => {
            showError("Failed to reorder media. Please try again.");
          },
        }
      );
    },
    [form, reorderMutation]
  );

  const handleSetPrimary = useCallback(
    (id: string) => {
      // Update gallery items
      setGalleryItems((prev) =>
        prev.map((item) => ({
          ...item,
          isPrimary: item.id === id,
        }))
      );

      // Notify backend
      setPrimaryMutation.mutate(
        { id },
        {
          onSuccess: () => {
            showSuccess("Primary image updated.");
          },
          onError: () => {
            showError("Failed to set primary image.");
          },
        }
      );
    },
    [setPrimaryMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      // Remove from gallery
      setGalleryItems((prev) => prev.filter((item) => item.id !== id));

      // Remove from form
      const current = form.getValues("mediaIds") ?? [];
      form.setValue(
        "mediaIds",
        current.filter((mid) => mid !== id),
        { shouldDirty: true }
      );

      // Notify backend
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            showSuccess("Media deleted.");
          },
          onError: () => {
            showError("Failed to delete media.");
          },
        }
      );
    },
    [form, deleteMutation]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Media</h2>
        <p className="text-sm text-muted-foreground">
          Upload photos and documents for your listing. You can add media now
          or after saving the draft.
        </p>
      </div>

      {/* Upload zone */}
      <MediaUploader
        ownerType={ownerType}
        ownerId={ownerId}
        mediaType="IMAGE"
        maxFiles={MEDIA_CONSTRAINTS.maxFiles}
        existingCount={galleryItems.length}
        onUploadComplete={handleUploadComplete}
        onUploadError={(_clientId, error) => {
          showError(`Upload failed: ${error}`);
        }}
      />

      {/* Gallery of existing/uploaded media */}
      {galleryItems.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Uploaded Media ({galleryItems.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag to reorder · First image is the primary
              </p>
            </div>
            <MediaGallery
              items={galleryItems}
              onReorder={handleReorder}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              editable
            />
          </div>
        </>
      )}

      {/* Info hint */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Supported formats: JPEG, PNG, WebP, GIF. Maximum file size:{" "}
          {MEDIA_CONSTRAINTS.maxFileSize / (1024 * 1024)} MB. Up to{" "}
          {MEDIA_CONSTRAINTS.maxFiles} files per listing.
        </span>
      </div>
    </div>
  );
}
