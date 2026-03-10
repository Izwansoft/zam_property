// =============================================================================
// useLegalCases — TanStack Query hooks for Legal module
// =============================================================================
// Provides list, detail, documents, mutations for legal cases and panel lawyers.
// API: /api/v1/legal-cases, /api/v1/panel-lawyers
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  LegalCase,
  LegalDocument,
  LegalCaseFilters,
  CreateLegalCaseDto,
  UpdateLegalCaseDto,
  AssignLawyerDto,
  GenerateNoticeDto,
  ResolveCaseDto,
  UploadLegalDocumentDto,
  PanelLawyer,
} from "../types";
import { cleanLegalCaseFilters } from "../types";

// ---------------------------------------------------------------------------
// List legal cases
// ---------------------------------------------------------------------------

/**
 * Fetch paginated legal case list with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useLegalCases({ status: LegalCaseStatus.NOTICE_SENT });
 * // data.items: LegalCase[], data.pagination
 * ```
 */
export function useLegalCases(filters: LegalCaseFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanLegalCaseFilters(filters);

  return useApiPaginatedQuery<LegalCase>({
    queryKey: queryKeys.legalCases.list(partnerKey, cleanedParams),
    path: "/legal-cases",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Single legal case detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single legal case by ID (includes lawyer & documents).
 */
export function useLegalCase(caseId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<LegalCase>({
    queryKey: queryKeys.legalCases.detail(partnerKey, caseId ?? ""),
    path: `/legal-cases/${caseId}`,
    enabled: !!partnerId && !!caseId,
  });
}

// ---------------------------------------------------------------------------
// Legal case documents
// ---------------------------------------------------------------------------

/**
 * Fetch documents for a legal case.
 */
export function useLegalCaseDocuments(caseId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<LegalDocument[]>({
    queryKey: queryKeys.legalCases.documents(partnerKey, caseId ?? ""),
    path: `/legal-cases/${caseId}/documents`,
    enabled: !!partnerId && !!caseId,
  });
}

// ---------------------------------------------------------------------------
// Create legal case
// ---------------------------------------------------------------------------

/**
 * Create a new legal case.
 * POST /api/v1/legal-cases
 */
export function useCreateLegalCase() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalCase, CreateLegalCaseDto>({
    path: "/legal-cases",
    method: "POST",
    invalidateKeys: [queryKeys.legalCases.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Update legal case
// ---------------------------------------------------------------------------

/**
 * Update a legal case.
 * PATCH /api/v1/legal-cases/:id
 */
export function useUpdateLegalCase(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalCase, UpdateLegalCaseDto>({
    path: `/legal-cases/${caseId}`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.legalCases.all(partnerKey),
      queryKeys.legalCases.detail(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Assign lawyer
// ---------------------------------------------------------------------------

/**
 * Assign a panel lawyer to a case.
 * POST /api/v1/legal-cases/:id/assign-lawyer
 */
export function useAssignLawyer(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalCase, AssignLawyerDto>({
    path: `/legal-cases/${caseId}/assign-lawyer`,
    method: "POST",
    invalidateKeys: [
      queryKeys.legalCases.all(partnerKey),
      queryKeys.legalCases.detail(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Generate notice
// ---------------------------------------------------------------------------

/**
 * Generate a notice document for a case.
 * POST /api/v1/legal-cases/:id/notice
 */
export function useGenerateNotice(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalDocument, GenerateNoticeDto>({
    path: `/legal-cases/${caseId}/notice`,
    method: "POST",
    invalidateKeys: [
      queryKeys.legalCases.detail(partnerKey, caseId),
      queryKeys.legalCases.documents(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

/**
 * Update case status (state machine transition).
 * POST /api/v1/legal-cases/:id/status?status=NEW_STATUS
 */
export function useUpdateCaseStatus(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalCase, { status: string }>({
    path: `/legal-cases/${caseId}/status`,
    method: "POST",
    invalidateKeys: [
      queryKeys.legalCases.all(partnerKey),
      queryKeys.legalCases.detail(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Resolve case
// ---------------------------------------------------------------------------

/**
 * Resolve and close a legal case.
 * POST /api/v1/legal-cases/:id/resolve
 */
export function useResolveCase(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalCase, ResolveCaseDto>({
    path: `/legal-cases/${caseId}/resolve`,
    method: "POST",
    invalidateKeys: [
      queryKeys.legalCases.all(partnerKey),
      queryKeys.legalCases.detail(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Upload document
// ---------------------------------------------------------------------------

/**
 * Upload/attach a document to a legal case.
 * POST /api/v1/legal-cases/:id/documents
 */
export function useUploadLegalDocument(caseId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<LegalDocument, UploadLegalDocumentDto>({
    path: `/legal-cases/${caseId}/documents`,
    method: "POST",
    invalidateKeys: [
      queryKeys.legalCases.detail(partnerKey, caseId),
      queryKeys.legalCases.documents(partnerKey, caseId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Panel Lawyers
// ---------------------------------------------------------------------------

/**
 * List panel lawyers.
 * GET /api/v1/panel-lawyers
 */
export function usePanelLawyers(params?: Record<string, unknown>) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiPaginatedQuery<PanelLawyer>({
    queryKey: queryKeys.panelLawyers.list(partnerKey, params),
    path: "/panel-lawyers",
    params: params ?? {},
    format: "A",
    enabled: !!partnerId,
  });
}

/**
 * Get panel lawyer detail.
 * GET /api/v1/panel-lawyers/:id
 */
export function usePanelLawyer(lawyerId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<PanelLawyer>({
    queryKey: queryKeys.panelLawyers.detail(partnerKey, lawyerId ?? ""),
    path: `/panel-lawyers/${lawyerId}`,
    enabled: !!partnerId && !!lawyerId,
  });
}
