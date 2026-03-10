// =============================================================================
// Media Utils — Helpers for file validation, formatting, and type detection
// =============================================================================

import {
  MEDIA_CONSTRAINTS,
  type MediaType,
  type MediaUploadFile,
  type MediaGalleryItem,
  type MediaItem,
} from "../types";

// ---------------------------------------------------------------------------
// File size formatting
// ---------------------------------------------------------------------------

/**
 * Format bytes to human-readable string.
 *
 * @example
 * formatFileSize(1024)       // "1.0 KB"
 * formatFileSize(1048576)    // "1.0 MB"
 * formatFileSize(5242880)    // "5.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Media type detection
// ---------------------------------------------------------------------------

/**
 * Detect MediaType from MIME type string.
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

/**
 * Get human-readable media type label.
 */
export function getMediaTypeLabel(mediaType: MediaType): string {
  switch (mediaType) {
    case "IMAGE":
      return "Image";
    case "VIDEO":
      return "Video";
    case "DOCUMENT":
      return "Document";
    default:
      return "File";
  }
}

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

export interface FileValidationError {
  file: File;
  reason: string;
}

/**
 * Validate a single file against constraints.
 * Returns null if valid, or a reason string if invalid.
 */
export function validateFile(file: File): string | null {
  // Check file size
  if (file.size > MEDIA_CONSTRAINTS.maxFileSize) {
    return `File exceeds maximum size of ${formatFileSize(MEDIA_CONSTRAINTS.maxFileSize)}`;
  }

  // Check file type
  const allTypes: string[] = [
    ...MEDIA_CONSTRAINTS.acceptedImageTypes,
    ...MEDIA_CONSTRAINTS.acceptedDocumentTypes,
    ...MEDIA_CONSTRAINTS.acceptedVideoTypes,
  ];
  if (!allTypes.includes(file.type)) {
    return `File type "${file.type || "unknown"}" is not supported`;
  }

  return null;
}

/**
 * Validate multiple files against constraints (including max count).
 * Returns arrays of valid and invalid files.
 */
export function validateFiles(
  files: File[],
  existingCount: number = 0
): {
  valid: File[];
  invalid: FileValidationError[];
} {
  const valid: File[] = [];
  const invalid: FileValidationError[] = [];
  const remaining = MEDIA_CONSTRAINTS.maxFiles - existingCount;

  for (let i = 0; i < files.length; i++) {
    if (i >= remaining) {
      invalid.push({
        file: files[i],
        reason: `Maximum of ${MEDIA_CONSTRAINTS.maxFiles} files allowed`,
      });
      continue;
    }

    const reason = validateFile(files[i]);
    if (reason) {
      invalid.push({ file: files[i], reason });
    } else {
      valid.push(files[i]);
    }
  }

  return { valid, invalid };
}

// ---------------------------------------------------------------------------
// Accept string for file input
// ---------------------------------------------------------------------------

/**
 * Build the `accept` attribute for file inputs.
 *
 * @example
 * getAcceptString("IMAGE")     // "image/jpeg,image/png,image/webp,image/gif"
 * getAcceptString()            // all accepted types
 */
export function getAcceptString(mediaType?: MediaType): string {
  switch (mediaType) {
    case "IMAGE":
      return MEDIA_CONSTRAINTS.acceptedImageTypes.join(",");
    case "VIDEO":
      return MEDIA_CONSTRAINTS.acceptedVideoTypes.join(",");
    case "DOCUMENT":
      return MEDIA_CONSTRAINTS.acceptedDocumentTypes.join(",");
    default:
      return [
        ...MEDIA_CONSTRAINTS.acceptedImageTypes,
        ...MEDIA_CONSTRAINTS.acceptedDocumentTypes,
        ...MEDIA_CONSTRAINTS.acceptedVideoTypes,
      ].join(",");
  }
}

// ---------------------------------------------------------------------------
// Client ID generator
// ---------------------------------------------------------------------------

let clientIdCounter = 0;

/**
 * Generate a unique client-side ID for tracking upload files.
 */
export function generateClientId(): string {
  clientIdCounter += 1;
  return `upload-${Date.now()}-${clientIdCounter}`;
}

// ---------------------------------------------------------------------------
// Create MediaUploadFile from File
// ---------------------------------------------------------------------------

/**
 * Create a MediaUploadFile entry from a native File object.
 * Generates a client preview URL for images.
 */
export function createUploadFile(file: File): MediaUploadFile {
  const mediaType = getMediaType(file.type);
  const previewUrl =
    mediaType === "IMAGE" ? URL.createObjectURL(file) : undefined;

  return {
    clientId: generateClientId(),
    file,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    mediaType,
    status: "PENDING",
    progress: 0,
    previewUrl,
  };
}

// ---------------------------------------------------------------------------
// Convert server MediaItem to MediaGalleryItem
// ---------------------------------------------------------------------------

/**
 * Convert a server MediaItem to the gallery view model.
 */
export function toGalleryItem(item: MediaItem): MediaGalleryItem {
  return {
    id: item.id,
    url: item.cdnUrl,
    thumbnailUrl: item.thumbnailUrl,
    filename: item.originalFilename || item.filename,
    mimeType: item.mimeType,
    size: item.size,
    mediaType: item.mediaType,
    sortOrder: item.sortOrder,
    isPrimary: item.isPrimary,
    altText: item.altText,
    width: item.width,
    height: item.height,
  };
}

/**
 * Check if a MIME type is an image.
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Get file extension from filename.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Cleanup preview URLs (revoke object URLs to prevent memory leaks).
 */
export function revokePreviewUrls(files: MediaUploadFile[]): void {
  files.forEach((f) => {
    if (f.previewUrl) {
      URL.revokeObjectURL(f.previewUrl);
    }
  });
}
