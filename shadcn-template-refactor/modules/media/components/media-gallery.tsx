// =============================================================================
// MediaGallery — Sortable gallery with drag-reorder, set primary, delete
// =============================================================================
// Displays uploaded media as a grid with:
// - Drag-reorder (using native drag-and-drop)
// - Set primary image
// - Delete with confirmation
// - Click to preview (opens ImagePreview dialog)
// =============================================================================

"use client";

import { useState, useCallback, useRef } from "react";
import {
  Star,
  Trash2,
  GripVertical,
  Eye,
  FileImage,
  FileVideo,
  FileText,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import { ImagePreview } from "./image-preview";
import type { MediaGalleryItem, MediaType } from "../types";
import { formatFileSize, isImageType } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MediaGalleryProps {
  /** Media items to display */
  items: MediaGalleryItem[];
  /** Callback when items are reordered (new order) */
  onReorder?: (items: MediaGalleryItem[]) => void;
  /** Callback when primary is set */
  onSetPrimary?: (id: string) => void;
  /** Callback when an item is deleted */
  onDelete?: (id: string) => void;
  /** Whether editing actions are enabled */
  editable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaGallery({
  items,
  onReorder,
  onSetPrimary,
  onDelete,
  editable = true,
  className,
}: MediaGalleryProps) {
  const [previewItem, setPreviewItem] = useState<MediaGalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaGalleryItem | null>(
    null
  );
  const dragRef = useRef<{ dragIndex: number; hoverIndex: number } | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ---- Drag-and-drop handlers ----

  const handleDragStart = useCallback((index: number) => {
    dragRef.current = { dragIndex: index, hoverIndex: index };
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragRef.current) {
        dragRef.current.hoverIndex = index;
        setDragOverIndex(index);
      }
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current || !onReorder) {
      setDragOverIndex(null);
      dragRef.current = null;
      return;
    }

    const { dragIndex, hoverIndex } = dragRef.current;
    if (dragIndex !== hoverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, removed);

      // Update sortOrder
      const reordered = newItems.map((item, idx) => ({
        ...item,
        sortOrder: idx,
      }));
      onReorder(reordered);
    }

    setDragOverIndex(null);
    dragRef.current = null;
  }, [items, onReorder]);

  // ---- Delete confirmation ----

  const confirmDelete = useCallback(() => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, onDelete]);

  // ---- Empty state ----

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
          className
        )}
      >
        <FileImage className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No media uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          className
        )}
      >
        {items.map((item, index) => (
          <GalleryItem
            key={item.id}
            item={item}
            index={index}
            editable={editable}
            isDragOver={dragOverIndex === index}
            onPreview={() => setPreviewItem(item)}
            onSetPrimary={onSetPrimary}
            onDelete={() => setDeleteTarget(item)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Image Preview Dialog */}
      {previewItem && isImageType(previewItem.mimeType) && (
        <ImagePreview
          open={!!previewItem}
          onOpenChange={(open) => {
            if (!open) setPreviewItem(null);
          }}
          src={previewItem.url}
          filename={previewItem.filename}
          fileSize={previewItem.size}
          alt={previewItem.altText}
          width={previewItem.width}
          height={previewItem.height}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;
              {deleteTarget?.filename}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// GalleryItem — Individual media card in the grid
// ---------------------------------------------------------------------------

interface GalleryItemProps {
  item: MediaGalleryItem;
  index: number;
  editable: boolean;
  isDragOver: boolean;
  onPreview: () => void;
  onSetPrimary?: (id: string) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function GalleryItem({
  item,
  index,
  editable,
  isDragOver,
  onPreview,
  onSetPrimary,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: GalleryItemProps) {
  const isImage = isImageType(item.mimeType);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all",
        isDragOver && "border-primary ring-1 ring-primary/30",
        editable && "cursor-grab active:cursor-grabbing"
      )}
      draggable={editable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={onPreview}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPreview();
          }
        }}
      >
        {isImage ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.altText || item.filename}
            className="size-full object-cover transition-transform group-hover:scale-105"
            draggable={false}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {getMediaIcon(item.mediaType)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <Eye className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Primary badge */}
        {item.isPrimary && (
          <Badge
            variant="default"
            className="absolute top-1.5 left-1.5 gap-1 text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-500/90"
          >
            <Star className="size-2.5 fill-current" />
            Primary
          </Badge>
        )}

        {/* Sort order indicator */}
        <span className="absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white">
          {index + 1}
        </span>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between p-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium">{item.filename}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(item.size)}
          </p>
        </div>

        {editable && (
          <div className="flex shrink-0 items-center">
            {/* Drag handle */}
            <GripVertical className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="mr-2 size-3.5" />
                  Preview
                </DropdownMenuItem>
                {!item.isPrimary && onSetPrimary && (
                  <DropdownMenuItem onClick={() => onSetPrimary(item.id)}>
                    <Star className="mr-2 size-3.5" />
                    Set as primary
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function MediaGallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border">
          <div className="aspect-square rounded-t-lg bg-muted" />
          <div className="space-y-1 p-1.5">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMediaIcon(mediaType: MediaType) {
  switch (mediaType) {
    case "IMAGE":
      return <FileImage className="size-8 text-muted-foreground" />;
    case "VIDEO":
      return <FileVideo className="size-8 text-muted-foreground" />;
    case "DOCUMENT":
      return <FileText className="size-8 text-muted-foreground" />;
  }
}
