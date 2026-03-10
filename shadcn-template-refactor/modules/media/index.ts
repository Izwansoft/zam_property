// =============================================================================
// Media Module — Barrel exports
// =============================================================================
// Re-exports all public API from the media module.
// =============================================================================

// ---- Types ----
export type {
  MediaType,
  MediaStatus,
  MediaItem,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ConfirmUploadDto,
  ReorderMediaDto,
  SetPrimaryMediaDto,
  MediaUploadFile,
  MediaGalleryItem,
} from "./types";
export { MEDIA_CONSTRAINTS } from "./types";

// ---- Utils ----
export {
  formatFileSize,
  getMediaType,
  getMediaTypeLabel,
  validateFile,
  validateFiles,
  getAcceptString,
  generateClientId,
  createUploadFile,
  toGalleryItem,
  isImageType,
  getFileExtension,
  revokePreviewUrls,
} from "./utils";
export type { FileValidationError } from "./utils";

// ---- Hooks ----
export { usePresignedUrl } from "./hooks/use-presigned-url";
export { useConfirmUpload } from "./hooks/use-confirm-upload";
export {
  useDeleteMedia,
  useReorderMedia,
  useSetPrimaryMedia,
} from "./hooks/use-media-mutations";
export { useMediaUpload } from "./hooks/use-media-upload";
export type {
  UseMediaUploadOptions,
  UseMediaUploadReturn,
} from "./hooks/use-media-upload";

// ---- Components ----
export { MediaUploader } from "./components/media-uploader";
export type { MediaUploaderProps } from "./components/media-uploader";
export { ImagePreview } from "./components/image-preview";
export type { ImagePreviewProps } from "./components/image-preview";
export {
  MediaGallery,
  MediaGallerySkeleton,
} from "./components/media-gallery";
export type { MediaGalleryProps } from "./components/media-gallery";
