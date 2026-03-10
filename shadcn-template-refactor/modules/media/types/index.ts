// =============================================================================
// Media Types — Domain type definitions for media upload/management
// =============================================================================
// Maps to backend media endpoints + S3 presigned URL flow.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";

export type MediaStatus =
  | "PENDING"      // presigned URL requested, not yet uploaded
  | "UPLOADING"    // client-side upload in progress
  | "UPLOADED"     // upload complete, not confirmed
  | "CONFIRMED"    // backend confirmed, ready to use
  | "FAILED";      // upload or confirmation failed

// ---------------------------------------------------------------------------
// Media Item (server entity)
// ---------------------------------------------------------------------------

export interface MediaItem {
  id: string;
  partnerId: string;
  entityId?: string;
  entityType?: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
  cdnUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isPrimary: boolean;
  altText?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Presigned URL — Request / Response
// ---------------------------------------------------------------------------

export interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
  ownerType: string;
  ownerId: string;
  visibility?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
  mediaId: string;
}

// ---------------------------------------------------------------------------
// Confirm Upload — Request / Response
// ---------------------------------------------------------------------------

export interface ConfirmUploadDto {
  mediaId: string;
  storageKey: string;
}

// ---------------------------------------------------------------------------
// Reorder / Set Primary DTOs
// ---------------------------------------------------------------------------

export interface ReorderMediaDto {
  mediaIds: string[];
}

export interface SetPrimaryMediaDto {
  id: string;
}

// ---------------------------------------------------------------------------
// Client-side Upload State (per file)
// ---------------------------------------------------------------------------

export interface MediaUploadFile {
  /** Client-side unique ID */
  clientId: string;
  /** Original file reference */
  file: File;
  /** File name */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Resolved media type */
  mediaType: MediaType;
  /** Upload status */
  status: MediaStatus;
  /** Upload progress (0–100) */
  progress: number;
  /** Server media ID (once presigned URL obtained) */
  mediaId?: string;
  /** Storage key from presigned URL response */
  storageKey?: string;
  /** Presigned upload URL */
  uploadUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Preview URL (object URL for client-side preview) */
  previewUrl?: string;
}

// ---------------------------------------------------------------------------
// Validation constraints
// ---------------------------------------------------------------------------

export const MEDIA_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  maxFiles: 20,
  acceptedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  acceptedDocumentTypes: [
    "application/pdf",
  ],
  acceptedVideoTypes: [
    "video/mp4",
    "video/webm",
  ],
  get allAcceptedTypes() {
    return [
      ...this.acceptedImageTypes,
      ...this.acceptedDocumentTypes,
      ...this.acceptedVideoTypes,
    ];
  },
} as const;

// ---------------------------------------------------------------------------
// Media Gallery Item (unified view model for gallery component)
// ---------------------------------------------------------------------------

export interface MediaGalleryItem {
  /** Media ID (from server) */
  id: string;
  /** CDN URL or client preview URL */
  url: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** File name */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size */
  size: number;
  /** Media type */
  mediaType: MediaType;
  /** Sort order */
  sortOrder: number;
  /** Is primary image */
  isPrimary: boolean;
  /** Alt text */
  altText?: string;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
}
