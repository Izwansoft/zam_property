// =============================================================================
// useMediaUpload — Orchestrates the full presigned URL upload flow
// =============================================================================
// 1. Validate files client-side
// 2. Request presigned URL from backend
// 3. Upload file directly to S3/MinIO
// 4. Confirm upload with backend
// 5. Track progress and state per file
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

import { usePresignedUrl } from "./use-presigned-url";
import { useConfirmUpload } from "./use-confirm-upload";
import type {
  MediaUploadFile,
  PresignedUrlRequest,
  MediaType,
} from "../types";
import {
  validateFiles,
  createUploadFile,
  revokePreviewUrls,
  type FileValidationError,
} from "../utils";

// ---------------------------------------------------------------------------
// Hook Options
// ---------------------------------------------------------------------------

export interface UseMediaUploadOptions {
  /** Max files allowed (default: MEDIA_CONSTRAINTS.maxFiles) */
  maxFiles?: number;
  /** Owner type for media association (e.g. 'listing', 'vendor', 'user') */
  ownerType: string;
  /** Owner ID (UUID) */
  ownerId: string;
  /** Restrict to a specific media type */
  mediaType?: MediaType;
  /** Callback when a file is successfully uploaded and confirmed */
  onUploadComplete?: (mediaId: string, file: MediaUploadFile) => void;
  /** Callback on validation errors */
  onValidationError?: (errors: FileValidationError[]) => void;
  /** Callback on upload error */
  onUploadError?: (clientId: string, error: string) => void;
}

// ---------------------------------------------------------------------------
// Hook Return
// ---------------------------------------------------------------------------

export interface UseMediaUploadReturn {
  /** Currently tracked upload files */
  files: MediaUploadFile[];
  /** Whether any file is currently uploading */
  isUploading: boolean;
  /** Add files to upload queue and start uploading */
  addFiles: (files: File[]) => void;
  /** Remove a file by client ID (cancels if uploading) */
  removeFile: (clientId: string) => void;
  /** Retry a failed upload */
  retryFile: (clientId: string) => void;
  /** Clear all completed/failed files */
  clearCompleted: () => void;
  /** Clear all files */
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediaUpload(
  options: UseMediaUploadOptions
): UseMediaUploadReturn {
  const {
    maxFiles = 20,
    ownerType,
    ownerId,
    mediaType,
    onUploadComplete,
    onValidationError,
    onUploadError,
  } = options;

  const [files, setFiles] = useState<MediaUploadFile[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Mutation hooks
  const presignMutation = usePresignedUrl();
  const confirmMutation = useConfirmUpload();

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      revokePreviewUrls(files);
      // Abort any in-flight uploads
      abortControllers.current.forEach((ctrl) => ctrl.abort());
      abortControllers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update a single file in state
  const updateFile = useCallback(
    (clientId: string, update: Partial<MediaUploadFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.clientId === clientId ? { ...f, ...update } : f))
      );
    },
    []
  );

  // Upload a single file through the presigned URL flow
  const uploadSingleFile = useCallback(
    async (uploadFile: MediaUploadFile) => {
      const { clientId, file, filename, mimeType, size } = uploadFile;

      try {
        // Step 1: Request presigned URL
        updateFile(clientId, { status: "PENDING", progress: 0 });

        const presignRequest: PresignedUrlRequest = {
          filename,
          mimeType,
          size,
          ownerType,
          ownerId,
        };

        const presignResponse =
          await presignMutation.mutateAsync(presignRequest);

        updateFile(clientId, {
          mediaId: presignResponse.mediaId,
          storageKey: presignResponse.storageKey,
          uploadUrl: presignResponse.uploadUrl,
          status: "UPLOADING",
        });

        // Step 2: Upload directly to S3/MinIO
        const abortController = new AbortController();
        abortControllers.current.set(clientId, abortController);

        await axios.put(presignResponse.uploadUrl, file, {
          headers: {
            "Content-Type": mimeType,
          },
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            updateFile(clientId, { progress: percent });
          },
        });

        abortControllers.current.delete(clientId);

        updateFile(clientId, { status: "UPLOADED", progress: 100 });

        // Step 3: Confirm upload with backend
        await confirmMutation.mutateAsync({
          mediaId: presignResponse.mediaId,
          storageKey: presignResponse.storageKey,
        });

        updateFile(clientId, { status: "CONFIRMED" });
        onUploadComplete?.(presignResponse.mediaId, uploadFile);
      } catch (error) {
        abortControllers.current.delete(clientId);

        // Don't treat abort as error
        if (axios.isCancel(error)) return;

        const errorMsg =
          error instanceof Error ? error.message : "Upload failed";
        updateFile(clientId, { status: "FAILED", error: errorMsg });
        onUploadError?.(clientId, errorMsg);
      }
    },
    [
      ownerType,
      ownerId,
      mediaType,
      presignMutation,
      confirmMutation,
      updateFile,
      onUploadComplete,
      onUploadError,
    ]
  );

  // Add files to queue and start uploads
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const confirmedCount = files.filter(
        (f) => f.status === "CONFIRMED" || f.status === "UPLOADING"
      ).length;
      const { valid, invalid } = validateFiles(newFiles, confirmedCount);

      if (invalid.length > 0) {
        onValidationError?.(invalid);
      }

      if (valid.length === 0) return;

      const uploadFiles = valid.map(createUploadFile);

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Start uploading each file
      uploadFiles.forEach((uf) => uploadSingleFile(uf));
    },
    [files, onValidationError, uploadSingleFile]
  );

  // Remove a file (abort upload if in progress)
  const removeFile = useCallback(
    (clientId: string) => {
      const controller = abortControllers.current.get(clientId);
      if (controller) {
        controller.abort();
        abortControllers.current.delete(clientId);
      }

      setFiles((prev) => {
        const file = prev.find((f) => f.clientId === clientId);
        if (file?.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
        return prev.filter((f) => f.clientId !== clientId);
      });
    },
    []
  );

  // Retry a failed upload
  const retryFile = useCallback(
    (clientId: string) => {
      const file = files.find((f) => f.clientId === clientId);
      if (!file || file.status !== "FAILED") return;

      updateFile(clientId, {
        status: "PENDING",
        progress: 0,
        error: undefined,
      });
      uploadSingleFile(file);
    },
    [files, updateFile, uploadSingleFile]
  );

  // Clear completed/failed files
  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      const toRemove = prev.filter(
        (f) => f.status === "CONFIRMED" || f.status === "FAILED"
      );
      revokePreviewUrls(toRemove);
      return prev.filter(
        (f) => f.status !== "CONFIRMED" && f.status !== "FAILED"
      );
    });
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    abortControllers.current.forEach((ctrl) => ctrl.abort());
    abortControllers.current.clear();
    revokePreviewUrls(files);
    setFiles([]);
  }, [files]);

  const isUploading = files.some(
    (f) => f.status === "UPLOADING" || f.status === "PENDING"
  );

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
  };
}
