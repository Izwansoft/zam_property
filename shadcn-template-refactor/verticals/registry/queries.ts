// verticals/registry/queries.ts — TanStack Query hooks for vertical registry

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVerticals, fetchVertical, fetchVerticalSchema } from "./api";
import { verticalKeys } from "./keys";
import type { VerticalDefinition, AttributeSchema } from "../types";

/** 30-minute staleTime — registry data is relatively static */
const REGISTRY_STALE_TIME = 30 * 60 * 1000;

/**
 * Fetch all available vertical definitions.
 * Cached aggressively (30-min staleTime).
 */
export function useVerticals() {
  return useQuery<VerticalDefinition[], Error>({
    queryKey: verticalKeys.list(),
    queryFn: fetchVerticals,
    staleTime: REGISTRY_STALE_TIME,
    gcTime: REGISTRY_STALE_TIME * 2,
  });
}

/**
 * Fetch a single vertical definition by type.
 * Only fetches when verticalType is provided.
 */
export function useVertical(verticalType: string | null | undefined) {
  return useQuery<VerticalDefinition, Error>({
    queryKey: verticalKeys.schema(verticalType ?? ""),
    queryFn: () => fetchVertical(verticalType!),
    enabled: !!verticalType,
    staleTime: REGISTRY_STALE_TIME,
    gcTime: REGISTRY_STALE_TIME * 2,
  });
}

/**
 * Fetch the attribute schema for a specific vertical type.
 * This is the primary hook used by AttributeRenderer and DynamicForm.
 *
 * @param verticalType - The vertical type (e.g. "REAL_ESTATE")
 * @param version - Optional schema version (defaults to latest)
 */
export function useVerticalSchema(
  verticalType: string | null | undefined,
  version?: string
) {
  return useQuery<AttributeSchema, Error>({
    queryKey: version
      ? verticalKeys.schemaVersioned(verticalType ?? "", version)
      : verticalKeys.schema(verticalType ?? ""),
    queryFn: () => fetchVerticalSchema(verticalType!, version),
    enabled: !!verticalType,
    staleTime: REGISTRY_STALE_TIME,
    gcTime: REGISTRY_STALE_TIME * 2,
  });
}
