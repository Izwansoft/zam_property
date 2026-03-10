// =============================================================================
// ImageUploader — Upload images to S3/MinIO with drag-drop and preview
// =============================================================================
// Reusable image upload component with:
// - Drag & drop support
// - Image preview (before and after upload)
// - Progress indicator
// - URL input fallback
// =============================================================================

"use client";

import { useState, useCallback, useRef, type DragEvent, useEffect } from "react";
import {
  Upload,
  X,
  Loader2,
  ImageIcon,
  Link2,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/errors/toast-helpers";

import {
  useMediaUpload,
  validateImageFile,
  ALLOWED_IMAGE_TYPES,
} from "@/hooks/use-media-upload";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ImageUploaderProps {
  /** Current image URL (for edit mode) */
  value?: string;
  /** Callback when image URL changes */
  onChange: (url: string) => void;
  /** Label for the uploader */
  label?: string;
  /** Help text */
  helperText?: string;
  /** Owner type for media categorization */
  ownerType?: "LISTING" | "VENDOR" | "USER" | "PARTNER" | "REVIEW" | "TENANCY";
  /** Owner ID for media categorization */
  ownerId?: string;
  /** Aspect ratio for preview (e.g., "16/9", "1/1", "auto") */
  aspectRatio?: string;
  /** Max width for preview container */
  maxPreviewWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImageUploader({
  value,
  onChange,
  label,
  helperText,
  ownerType = "PARTNER",
  ownerId = "general",
  aspectRatio = "auto",
  maxPreviewWidth = 300,
  className,
  disabled = false,
  placeholder = "https://example.com/image.png",
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMediaUpload();

  // Sync URL input with external value
  useEffect(() => {
    setUrlInput(value ?? "");
  }, [value]);

  // ---- Clean up preview URL on unmount ----
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ---- File selection handlers ----

  const handleFileSelect = useCallback(
    async (file: File) => {
      const error = validateImageFile(file);
      if (error) {
        showError(error);
        return;
      }

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setProgress(0);

      try {
        const result = await uploadMutation.mutateAsync({
          file,
          ownerType,
          ownerId,
          visibility: "PUBLIC",
          onProgress: setProgress,
        });

        // Update with final CDN URL
        onChange(result.url);
        setPreviewUrl(null); // Clear local preview, use value instead
      } catch (err) {
        // Revert preview on error
        setPreviewUrl(null);
        URL.revokeObjectURL(localPreview);
        showError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [onChange, ownerType, ownerId, uploadMutation]
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

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles[0]);
      }
    },
    [handleFileSelect, disabled]
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
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // ---- URL input handler ----

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  }, [urlInput, onChange]);

  // ---- Clear handler ----

  const handleClear = useCallback(() => {
    onChange("");
    setUrlInput("");
    setPreviewUrl(null);
    setProgress(0);
  }, [onChange]);

  // ---- Render ----

  const isUploading = uploadMutation.isPending;
  const displayUrl = previewUrl || value;
  const hasImage = !!displayUrl;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={disabled}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" disabled={disabled}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            URL
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          {/* Preview or Dropzone */}
          {hasImage ? (
            <div
              className="relative rounded-lg border bg-muted/30"
              style={{ maxWidth: maxPreviewWidth }}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg",
                  aspectRatio !== "auto" && `aspect-[${aspectRatio}]`
                )}
                style={aspectRatio === "auto" ? { minHeight: 100 } : undefined}
              >
                <Image
                  src={displayUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized // For external URLs
                />

                {/* Uploading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <Progress value={progress} className="mt-2 w-3/4" />
                    <span className="mt-1 text-xs text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                )}

                {/* Success indicator */}
                {!isUploading && value && !previewUrl && (
                  <div className="absolute right-2 top-2">
                    <div className="rounded-full bg-green-500 p-1">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Clear button */}
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <Progress value={progress} className="mt-3 w-full max-w-50" />
                  <span className="mt-1 text-sm text-muted-foreground">
                    Uploading... {progress}%
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, WebP, GIF, SVG up to 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput.trim()}
            >
              Set
            </Button>
          </div>

          {/* URL Preview */}
          {value && (
            <div
              className="relative rounded-lg border bg-muted/30"
              style={{ maxWidth: maxPreviewWidth }}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg",
                  aspectRatio !== "auto" && `aspect-[${aspectRatio}]`
                )}
                style={aspectRatio === "auto" ? { minHeight: 100 } : undefined}
              >
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

