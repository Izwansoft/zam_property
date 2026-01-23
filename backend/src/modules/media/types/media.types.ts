import { MediaVisibility, Media } from '@prisma/client';

export type MediaRecord = Media;

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  [key: string]: unknown;
}

export interface UploadIntent {
  filename: string;
  mimeType: string;
  size: number;
  ownerType: string;
  ownerId: string;
  visibility?: MediaVisibility;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
  mediaId: string;
}
