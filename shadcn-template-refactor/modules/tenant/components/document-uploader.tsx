// =============================================================================
// DocumentUploader — Upload tenant documents with S3 presigned URL
// =============================================================================
// Uses the same presigned URL flow as media uploads but specifically for
// tenant document verification.
// =============================================================================

"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import {
  Upload,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/errors/toast-helpers";

import { useUploadTenantDocument } from "../hooks/use-upload-document";
import type { TenantDocumentType } from "../types";
import type { UploadedDocument } from "../store/onboarding-store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DocumentUploaderProps {
  /** The type of document being uploaded */
  documentType: TenantDocumentType;
  /** The tenant ID (optional — uses general media upload if omitted) */
  tenantId?: string;
  /** Callback when upload is complete */
  onUploadComplete: (doc: UploadedDocument) => void;
  /** Callback to cancel upload selection */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentUploader({
  documentType,
  tenantId,
  onUploadComplete,
  onCancel,
  className,
}: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTenantDocument();

  // ---- File validation ----

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload JPG, PNG, WebP, or PDF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 10MB.";
    }
    return null;
  }, []);

  // ---- File selection handlers ----

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        showError(error);
        return;
      }
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

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

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ---- Upload handler ----

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync({
        tenantId,
        file: selectedFile,
        documentType,
        onProgress: setProgress,
      });

      onUploadComplete({
        id: result.id,
        type: documentType,
        fileName: selectedFile.name,
        fileUrl: result.fileUrl,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      });
    } catch {
      // Error is handled by the mutation
    }
  }, [selectedFile, documentType, uploadMutation, onUploadComplete]);

  // ---- Cancel handler ----

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setProgress(0);
    onCancel?.();
  }, [onCancel]);

  // ---- Render ----

  const isUploading = uploadMutation.isPending;
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        // Drop zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Upload className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop your file here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP, or PDF up to 10MB
          </p>
        </div>
      ) : (
        // Selected file preview
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Progress bar (during upload) */}
          {isUploading && (
            <div className="mt-3 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          {!isUploading && (
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleUpload}>
                <Upload className="mr-2 size-4" />
                Upload
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {uploadMutation.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" />
          <span>Upload failed. Please try again.</span>
        </div>
      )}
    </div>
  );
}
