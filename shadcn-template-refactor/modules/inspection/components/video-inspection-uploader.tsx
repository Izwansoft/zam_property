// =============================================================================
// VideoInspectionUploader — Large video file uploader for inspections
// =============================================================================
// Features:
//   - Mobile camera capture (accept="video/*;capture=camcorder")
//   - Chunked upload for large files (up to 500MB)
//   - Progress indicator with percentage and bytes
//   - Preview after upload
//   - Request video notice display
// =============================================================================

"use client";

import { useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Video,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileVideo,
  RotateCcw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useSubmitVideo } from "../hooks";
import type { SubmitVideoResponse, VideoUploadStage } from "../types";
import { InspectionStatus } from "../types";
import type { Inspection } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/3gpp",
  "video/x-matroska",
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoInspectionUploaderProps {
  inspection: Inspection;
  /** Callback when upload completes successfully */
  onUploadComplete?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoInspectionUploader({
  inspection,
  onUploadComplete,
  className = "",
}: VideoInspectionUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<VideoUploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const submitVideoMutation = useSubmitVideo(inspection.id);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm|3gp|mkv)$/i)) {
      return "Invalid file type. Supported formats: MP4, MOV, AVI, WebM, 3GP, MKV";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}`;
    }
    if (file.size === 0) {
      return "File appears to be empty";
    }
    return null;
  }, []);

  // ---------------------------------------------------------------------------
  // File selection
  // ---------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);
      setStage("idle");
      setProgress(0);
      setBytesUploaded(0);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Reset file input
      event.target.value = "";
    },
    [validateFile]
  );

  // ---------------------------------------------------------------------------
  // Upload flow
  // ---------------------------------------------------------------------------

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setError(null);
      setStage("requesting");
      setProgress(0);

      // Step 1: Get presigned upload URL from backend
      const submitData = {
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "video/mp4",
        fileSize: selectedFile.size,
      };

      let response: SubmitVideoResponse;
      try {
        response = await submitVideoMutation.mutateAsync(submitData);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get upload URL";
        throw new Error(errorMsg);
      }

      // Step 2: Upload file to presigned URL with progress tracking
      setStage("uploading");
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await axios.put(response.uploadUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type || "video/mp4",
        },
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setProgress(pct);
            setBytesUploaded(progressEvent.loaded);
          }
        },
      });

      // Step 3: Done
      setStage("complete");
      setProgress(100);
      onUploadComplete?.();
    } catch (err) {
      if (axios.isCancel(err)) {
        setStage("idle");
        setProgress(0);
        return;
      }
      setStage("error");
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed. Please try again."
      );
    } finally {
      abortControllerRef.current = null;
    }
  }, [selectedFile, submitVideoMutation, onUploadComplete]);

  // ---------------------------------------------------------------------------
  // Cancel & Reset
  // ---------------------------------------------------------------------------

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStage("idle");
    setProgress(0);
    setBytesUploaded(0);
  }, []);

  const handleReset = useCallback(() => {
    abortControllerRef.current?.abort();
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStage("idle");
    setProgress(0);
    setBytesUploaded(0);
    setError(null);
  }, [previewUrl]);

  // ---------------------------------------------------------------------------
  // Status check
  // ---------------------------------------------------------------------------

  const canUpload =
    inspection.videoRequested &&
    inspection.status === InspectionStatus.VIDEO_REQUESTED;

  // If video was already submitted
  if (inspection.status === InspectionStatus.VIDEO_SUBMITTED) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Video Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Video Submitted</AlertTitle>
            <AlertDescription>
              Your video has been submitted and is awaiting review from the
              property owner.
              {inspection.videoSubmittedAt && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Submitted on{" "}
                  {new Date(inspection.videoSubmittedAt).toLocaleDateString(
                    "en-MY",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If not in VIDEO_REQUESTED status, don't show uploader
  if (!canUpload) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4" />
          Video Inspection Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request notice */}
        <Alert variant="default">
          <Video className="h-4 w-4" />
          <AlertTitle>Video Inspection Requested</AlertTitle>
          <AlertDescription>
            The property owner has requested a video inspection. Please record a
            video walkthrough of the property and upload it below.
            {inspection.videoRequestedAt && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Requested on{" "}
                {new Date(inspection.videoRequestedAt).toLocaleDateString(
                  "en-MY",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/3gpp,.mp4,.mov,.avi,.webm,.3gp,.mkv"
          onChange={handleFileSelect}
          className="hidden"
        />
        {/* Camera capture input (hidden) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload area */}
        {!selectedFile && stage === "idle" && (
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center transition-colors hover:border-muted-foreground/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">Upload Inspection Video</p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP4, MOV, AVI, WebM up to {formatBytes(MAX_FILE_SIZE)}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileVideo className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Record Video
              </Button>
            </div>
          </div>
        )}

        {/* Selected file + preview */}
        {selectedFile && (
          <div className="space-y-3">
            {/* File info */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <FileVideo className="h-8 w-8 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                  {selectedFile.type && ` · ${selectedFile.type}`}
                </p>
              </div>
              {stage === "idle" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Video preview */}
            {previewUrl && stage !== "uploading" && stage !== "requesting" && (
              <div className="overflow-hidden rounded-lg bg-black">
                <video
                  src={previewUrl}
                  className="aspect-video w-full"
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            )}

            {/* Progress indicator */}
            {(stage === "requesting" ||
              stage === "uploading" ||
              stage === "confirming") && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    {stage === "requesting" && "Preparing upload..."}
                    {stage === "uploading" &&
                      `Uploading — ${progress}%`}
                    {stage === "confirming" && "Confirming upload..."}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                {stage === "uploading" && selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(bytesUploaded)} of{" "}
                    {formatBytes(selectedFile.size)}
                  </p>
                )}
              </div>
            )}

            {/* Success state */}
            {stage === "complete" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Upload Complete</AlertTitle>
                <AlertDescription>
                  Your video has been uploaded successfully and is now awaiting
                  review from the property owner.
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {stage === "idle" && (
                <Button onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              )}
              {(stage === "uploading" || stage === "requesting") && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              {stage === "error" && (
                <>
                  <Button onClick={handleUpload}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry Upload
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Choose Different File
                  </Button>
                </>
              )}
              {stage === "complete" && (
                <Button variant="outline" onClick={handleReset}>
                  Upload Another Video
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}
