// =============================================================================
// Property Member Hooks — TanStack Query hooks for property member CRUD
// =============================================================================
// Covers list members, add/update/remove member, my properties, my role.
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  PropertyMember,
  MyProperty,
  PropertyMemberFilters,
  AddPropertyMemberDto,
  UpdatePropertyMemberDto,
} from "../types";
import { cleanPropertyMemberFilters } from "../types";

// ---------------------------------------------------------------------------
// usePropertyMembers — paginated list of members for a property
// ---------------------------------------------------------------------------

/**
 * Fetch paginated property members for a specific listing.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePropertyMembers(listingId, { role: "PROPERTY_MANAGER" });
 * ```
 */
export function usePropertyMembers(
  listingId: string,
  filters: PropertyMemberFilters = {},
) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanPropertyMemberFilters(
    filters as Record<string, unknown>,
  );

  return useApiPaginatedQuery<PropertyMember>({
    queryKey: queryKeys.propertyMembers.list(
      partnerKey,
      listingId,
      cleanedParams,
    ),
    path: `/properties/${listingId}/members`,
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId && !!listingId,
  });
}

// ---------------------------------------------------------------------------
// useMyProperties — properties assigned to the current user
// ---------------------------------------------------------------------------

/**
 * Fetch all properties where the current user has a PropertyMember assignment.
 *
 * @example
 * ```tsx
 * const { data } = useMyProperties();
 * // data: MyProperty[]
 * ```
 */
export function useMyProperties() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<MyProperty[]>({
    queryKey: queryKeys.propertyMembers.myProperties(partnerKey),
    path: "/my/properties",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// useMyPropertyRole — current user's role on a specific property
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's PropertyRole on a specific listing.
 * Returns null if the user has no assignment.
 *
 * @example
 * ```tsx
 * const { data } = useMyPropertyRole(listingId);
 * if (data?.role === "PROPERTY_ADMIN") { ... }
 * ```
 */
export function useMyPropertyRole(listingId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<{ role: string } | null>({
    queryKey: queryKeys.propertyMembers.myRole(partnerKey, listingId),
    path: `/my/properties/${listingId}/role`,
    enabled: !!partnerId && !!listingId,
  });
}

// ---------------------------------------------------------------------------
// useAddPropertyMember — add a member to a property
// ---------------------------------------------------------------------------

/**
 * Mutation to add a new member to a property.
 *
 * @example
 * ```tsx
 * const { mutateAsync } = useAddPropertyMember(listingId);
 * await mutateAsync({ userId: "...", role: "PROPERTY_MANAGER" });
 * ```
 */
export function useAddPropertyMember(listingId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<PropertyMember, AddPropertyMemberDto>({
    path: `/properties/${listingId}/members`,
    method: "POST",
    invalidateKeys: [
      queryKeys.propertyMembers.all(partnerKey),
    ],
  });
}

// ---------------------------------------------------------------------------
// useUpdatePropertyMember — update a member's role/notes
// ---------------------------------------------------------------------------

/**
 * Mutation to update a property member's role or notes.
 *
 * @example
 * ```tsx
 * const { mutateAsync } = useUpdatePropertyMember(listingId);
 * await mutateAsync({ memberId: "...", dto: { role: "LEASING_MANAGER" } });
 * ```
 */
export function useUpdatePropertyMember(listingId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    PropertyMember,
    { memberId: string; dto: UpdatePropertyMemberDto }
  >({
    path: (vars) => `/properties/${listingId}/members/${vars.memberId}`,
    method: "PATCH",
    invalidateKeys: [
      queryKeys.propertyMembers.all(partnerKey),
    ],
  });
}

// ---------------------------------------------------------------------------
// useRemovePropertyMember — remove a member from a property
// ---------------------------------------------------------------------------

/**
 * Mutation to remove (soft-delete) a property member.
 *
 * @example
 * ```tsx
 * const { mutateAsync } = useRemovePropertyMember(listingId);
 * await mutateAsync("member-id");
 * ```
 */
export function useRemovePropertyMember(listingId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<void, string>({
    path: (memberId) => `/properties/${listingId}/members/${memberId}`,
    method: "DELETE",
    invalidateKeys: [
      queryKeys.propertyMembers.all(partnerKey),
    ],
  });
}
