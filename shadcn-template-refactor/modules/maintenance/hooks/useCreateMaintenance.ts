// =============================================================================
// useCreateMaintenance — TanStack Query mutation for creating maintenance tickets
// =============================================================================
// API: POST /api/v1/maintenance
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Maintenance,
  CreateMaintenanceDto,
  AddAttachmentDto,
  AttachmentUploadResponse,
  AddCommentDto,
  MaintenanceUpdate,
} from "../types";

/**
 * Create a new maintenance ticket.
 *
 * @example
 * ```tsx
 * const createMaintenance = useCreateMaintenance();
 * createMaintenance.mutate({
 *   tenancyId: "uuid",
 *   title: "Leaking pipe",
 *   description: "Water leaking from kitchen sink",
 *   category: MaintenanceCategory.PLUMBING,
 * });
 * ```
 */
export function useCreateMaintenance() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Maintenance, CreateMaintenanceDto>({
    path: "/maintenance",
    method: "POST",
    invalidateKeys: [queryKeys.maintenance.all(partnerKey)],
  });
}

/**
 * Add an attachment to a maintenance ticket.
 * Returns a presigned URL for direct S3 upload.
 *
 * @example
 * ```tsx
 * const addAttachment = useAddMaintenanceAttachment("ticket-uuid");
 * const { attachment, uploadUrl } = await addAttachment.mutateAsync({
 *   type: "IMAGE",
 *   fileName: "photo.jpg",
 *   mimeType: "image/jpeg",
 *   fileSize: 1024000,
 * });
 * // Then upload directly to uploadUrl
 * ```
 */
export function useAddMaintenanceAttachment(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<AttachmentUploadResponse, AddAttachmentDto>({
    path: `/maintenance/${ticketId}/attachments`,
    method: "POST",
    invalidateKeys: [queryKeys.maintenance.detail(partnerKey, ticketId)],
  });
}

/**
 * Add a comment/update to a maintenance ticket.
 *
 * @example
 * ```tsx
 * const addComment = useAddMaintenanceComment("ticket-uuid");
 * addComment.mutate({ message: "Issue is getting worse" });
 * ```
 */
export function useAddMaintenanceComment(ticketId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<MaintenanceUpdate, AddCommentDto>({
    path: `/maintenance/${ticketId}/comments`,
    method: "POST",
    invalidateKeys: [queryKeys.maintenance.detail(partnerKey, ticketId)],
  });
}
