// =============================================================================
// useMediaUpload — Upload media to S3/MinIO with presigned URL
// =============================================================================
// Generic media upload hook for images, documents, etc.
// Uses the backend presigned URL flow:
//   1. POST /media/request-upload → get presigned URL
//   2. PUT to S3/MinIO directly
//   3. POST /media/:id/confirm-upload → confirm upload
// =============================================================================

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";
type MediaOwnerType = "LISTING" | "VENDOR" | "USER" | "PARTNER" | "REVIEW" | "TENANCY";
type MediaVisibility = "PUBLIC" | "PRIVATE";

interface PresignedUrlResponse {
  data: {
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
    mediaId: string;
  };
}

interface ConfirmUploadResponse {
  data: {
    id: string;
    filename: string;
    cdnUrl: string;
    mimeType: string;
    size: number;
    mediaType: MediaType;
  };
}

export interface MediaUploadInput {
  file: File;
  ownerType?: MediaOwnerType;
  ownerId?: string;
  visibility?: MediaVisibility;
  onProgress?: (progress: number) => void;
}

export interface MediaUploadResult {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Invalid file type. Please upload JPG, PNG, WebP, GIF, SVG, or ICO.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "File too large. Maximum size is 10MB.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Detect media type from MIME
// ---------------------------------------------------------------------------

function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediaUpload() {
  return useMutation({
    mutationFn: async (input: MediaUploadInput): Promise<MediaUploadResult> => {
      const {
        file,
        ownerType = "PARTNER",
        ownerId = "general",
        visibility = "PUBLIC",
        onProgress,
      } = input;

      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Step 1: Request presigned URL
      const presignResponse = await apiClient.post<PresignedUrlResponse>(
        "/media/request-upload",
        {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          mediaType: detectMediaType(file.type),
          ownerType,
          ownerId,
          visibility,
        }
      );

      const { uploadUrl, storageKey, mediaId } = presignResponse.data.data;

      // Step 2: Upload directly to S3/MinIO
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        },
      });

      // Step 3: Confirm upload
      const confirmResponse = await apiClient.post<ConfirmUploadResponse>(
        `/media/${mediaId}/confirm-upload`,
        { storageKey }
      );

      const confirmed = confirmResponse.data.data;

      return {
        id: confirmed.id,
        url: confirmed.cdnUrl,
        filename: confirmed.filename,
        mimeType: confirmed.mimeType,
        size: confirmed.size,
      };
    },
  });
}

// Export validation for use in components
export { validateImageFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE };
