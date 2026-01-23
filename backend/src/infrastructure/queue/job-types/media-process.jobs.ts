import { BaseJobData } from '../queue.interfaces';

/**
 * Media processing job types per part-31.md specification.
 */
export type MediaProcessJobType =
  | 'image.resize'
  | 'image.optimize'
  | 'image.thumbnail'
  | 'image.process_all'
  | 'document.preview'
  | 'video.transcode';

/**
 * Image processing options.
 */
export interface ImageProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Base media process job payload.
 */
export interface MediaProcessJobBase extends BaseJobData {
  type: MediaProcessJobType;
  mediaId: string;
  sourceKey: string;
}

/**
 * Image resize job.
 */
export interface ImageResizeJob extends MediaProcessJobBase {
  type: 'image.resize';
  targetKey: string;
  options: ImageProcessOptions & {
    width: number;
    height: number;
  };
}

/**
 * Image optimize job.
 */
export interface ImageOptimizeJob extends MediaProcessJobBase {
  type: 'image.optimize';
  targetKey: string;
  options: {
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

/**
 * Image thumbnail job.
 */
export interface ImageThumbnailJob extends MediaProcessJobBase {
  type: 'image.thumbnail';
  targetKey: string;
  options: {
    width: number;
    height: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

/**
 * Process all images for a listing.
 */
export interface ImageProcessAllJob extends BaseJobData {
  type: 'image.process_all';
  listingId: string;
}

/**
 * Document preview job.
 */
export interface DocumentPreviewJob extends MediaProcessJobBase {
  type: 'document.preview';
  targetKey: string;
  options: {
    width?: number;
    height?: number;
    page?: number;
  };
}

/**
 * Video transcode job.
 */
export interface VideoTranscodeJob extends MediaProcessJobBase {
  type: 'video.transcode';
  targetKey: string;
  options: {
    resolution?: '720p' | '1080p' | '480p';
    format?: 'mp4' | 'webm';
    bitrate?: number;
  };
}

/**
 * Union type for all media process jobs.
 */
export type MediaProcessJob =
  | ImageResizeJob
  | ImageOptimizeJob
  | ImageThumbnailJob
  | ImageProcessAllJob
  | DocumentPreviewJob
  | VideoTranscodeJob;

/**
 * Thumbnail size presets.
 */
export const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 600 },
} as const;

/**
 * Standard image sizes for listings.
 */
export const LISTING_IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 400, height: 300 },
  detail: { width: 800, height: 600 },
  full: { width: 1920, height: 1080 },
} as const;
