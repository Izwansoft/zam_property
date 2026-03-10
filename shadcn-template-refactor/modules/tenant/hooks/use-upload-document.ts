// =============================================================================
// useUploadTenantDocument — Upload tenant documents with S3 presigned URL
// =============================================================================
// Backend: POST /api/v1/tenants/:id/documents — request upload URL
//          POST /api/v1/tenants/:id/documents/:documentId/confirm — confirm
// =============================================================================

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/api/client";
import type { TenantDocumentType } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresignedUrlResponse {
  data: {
    id: string;
    uploadUrl: string;
    fileUrl: string;
  };
}

export interface UploadDocumentInput {
  /** Tenant ID — if provided, uses tenant-specific document endpoint.
   *  If omitted (e.g., during onboarding), falls back to general media upload. */
  tenantId?: string;
  file: File;
  documentType: TenantDocumentType;
  onProgress?: (progress: number) => void;
}

export interface UploadDocumentResult {
  id: string;
  fileUrl: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUploadTenantDocument() {
  return useMutation({
    mutationFn: async (input: UploadDocumentInput): Promise<UploadDocumentResult> => {
      const { tenantId, file, documentType, onProgress } = input;

      // Step 1: Request presigned URL from backend
      // Use tenant-specific endpoint if tenantId available, else general media upload
      const presignPath = tenantId
        ? `/tenants/${tenantId}/documents`
        : "/media/request-upload";

      const presignResponse = await apiClient.post<PresignedUrlResponse>(
        presignPath,
        {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType,
          mediaType: "DOCUMENT",
        }
      );

      const { id, uploadUrl, fileUrl } = presignResponse.data.data;

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
      const confirmPath = tenantId
        ? `/tenants/${tenantId}/documents/${id}/confirm`
        : `/media/${id}/confirm-upload`;

      await apiClient.post(confirmPath);

      return { id, fileUrl };
    },
  });
}
