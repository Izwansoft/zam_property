// =============================================================================
// MediaUploader — Drag-and-drop file upload with progress tracking
// =============================================================================
// Handles file validation, drag-and-drop, upload progress, and status display.
// Uses the useMediaUpload hook for the presigned URL flow.
// =============================================================================

"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileImage,
  FileVideo,
  FileText,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  useMediaUpload,
  type UseMediaUploadOptions,
} from "../hooks/use-media-upload";
import type { MediaType, MediaUploadFile } from "../types";
import { MEDIA_CONSTRAINTS } from "../types";
import { formatFileSize, getAcceptString, getMediaTypeLabel } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MediaUploaderProps {
  /** Owner type for media association (e.g. 'listing', 'vendor', 'user') */
  ownerType: string;
  /** Owner ID (UUID) */
  ownerId: string;
  /** Restrict to specific media type */
  mediaType?: MediaType;
  /** Max number of files (default: MEDIA_CONSTRAINTS.maxFiles) */
  maxFiles?: number;
  /** Existing media count (to enforce total limit) */
  existingCount?: number;
  /** Callback when a file is confirmed */
  onUploadComplete?: UseMediaUploadOptions["onUploadComplete"];
  /** Callback when upload errors occur */
  onUploadError?: UseMediaUploadOptions["onUploadError"];
  /** Additional CSS classes */
  className?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaUploader({
  ownerType,
  ownerId,
  mediaType,
  maxFiles = MEDIA_CONSTRAINTS.maxFiles,
  existingCount = 0,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
}: MediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, addFiles, removeFile, retryFile, clearCompleted } =
    useMediaUpload({
      maxFiles,
      ownerType,
      ownerId,
      mediaType,
      onUploadComplete,
      onUploadError,
      onValidationError: (errors) => {
        // Validation errors are displayed inline per file
        console.warn(
          "Media validation errors:",
          errors.map((e) => `${e.file.name}: ${e.reason}`)
        );
      },
    });

  const remaining = maxFiles - existingCount;
  const canAddMore = remaining > 0 && !disabled;

  // ---- Drag-and-drop handlers ----

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (canAddMore) setIsDragOver(true);
    },
    [canAddMore]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!canAddMore) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [canAddMore, addFiles]
  );

  // ---- File input handler ----

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      addFiles(Array.from(selectedFiles));

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles]
  );

  const openFileDialog = useCallback(() => {
    if (canAddMore) {
      fileInputRef.current?.click();
    }
  }, [canAddMore]);

  // ---- Render ----

  const hasFiles = files.length > 0;
  const hasCompleted = files.some(
    (f) => f.status === "CONFIRMED" || f.status === "FAILED"
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={canAddMore ? 0 : -1}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragOver && "border-primary bg-primary/5",
          canAddMore && !isDragOver && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer",
          !canAddMore && "border-muted cursor-not-allowed opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        <div
          className={cn(
            "mb-3 flex size-12 items-center justify-center rounded-full",
            isDragOver ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "size-6",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <p className="text-sm font-medium">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Max {formatFileSize(MEDIA_CONSTRAINTS.maxFileSize)} per file</span>
          <span>·</span>
          <span>
            {remaining > 0
              ? `${remaining} file${remaining !== 1 ? "s" : ""} remaining`
              : "File limit reached"}
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptString(mediaType)}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!canAddMore}
        />
      </div>

      {/* Upload queue */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {isUploading ? "Uploading..." : "Upload queue"}
            </p>
            {hasCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="h-7 text-xs"
              >
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <UploadFileItem
                key={file.clientId}
                file={file}
                onRemove={removeFile}
                onRetry={retryFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadFileItem — Individual file upload status
// ---------------------------------------------------------------------------

function UploadFileItem({
  file,
  onRemove,
  onRetry,
}: {
  file: MediaUploadFile;
  onRemove: (clientId: string) => void;
  onRetry: (clientId: string) => void;
}) {
  const icon = getFileIcon(file.mediaType);
  const isActive =
    file.status === "PENDING" || file.status === "UPLOADING";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        file.status === "FAILED" && "border-destructive/50 bg-destructive/5",
        file.status === "CONFIRMED" && "border-green-500/30 bg-green-500/5"
      )}
    >
      {/* Preview / Icon */}
      <div className="relative size-10 shrink-0 overflow-hidden rounded">
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.filename}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            {icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.filename}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <span>·</span>
          <span>{getMediaTypeLabel(file.mediaType)}</span>
          {file.error && (
            <>
              <span>·</span>
              <span className="text-destructive">{file.error}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {isActive && (
          <Progress
            value={file.progress}
            className="mt-1.5 h-1"
          />
        )}
      </div>

      {/* Status / Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {file.status === "UPLOADING" && (
          <Loader2 className="size-4 animate-spin text-primary" />
        )}
        {file.status === "CONFIRMED" && (
          <CheckCircle2 className="size-4 text-green-500" />
        )}
        {file.status === "FAILED" && (
          <>
            <AlertCircle className="size-4 text-destructive" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onRetry(file.clientId)}
              title="Retry upload"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </>
        )}

        {/* Remove button (always visible) */}
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => onRemove(file.clientId)}
          title="Remove"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileIcon(mediaType: MediaType) {
  switch (mediaType) {
    case "IMAGE":
      return <FileImage className="size-5 text-muted-foreground" />;
    case "VIDEO":
      return <FileVideo className="size-5 text-muted-foreground" />;
    case "DOCUMENT":
      return <FileText className="size-5 text-muted-foreground" />;
  }
}
