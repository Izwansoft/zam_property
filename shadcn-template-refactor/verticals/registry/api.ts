// verticals/registry/api.ts — API functions for vertical registry

import { apiClient } from "@/lib/api/client";
import type { VerticalDefinition, AttributeSchema } from "../types";

/**
 * Fetch all available vertical definitions.
 * GET /api/v1/verticals
 */
export async function fetchVerticals(): Promise<VerticalDefinition[]> {
  const response = await apiClient.get<{ data: VerticalDefinition[] }>(
    "/verticals"
  );
  return response.data.data;
}

/**
 * Fetch a single vertical definition by type.
 * GET /api/v1/verticals/:type
 */
export async function fetchVertical(
  verticalType: string
): Promise<VerticalDefinition> {
  const response = await apiClient.get<{ data: VerticalDefinition }>(
    `/verticals/${verticalType}`
  );
  return response.data.data;
}

/**
 * Fetch the attribute schema for a specific vertical type and version.
 * GET /api/v1/verticals/:type/schema?version=X
 */
export async function fetchVerticalSchema(
  verticalType: string,
  version?: string
): Promise<AttributeSchema> {
  const params = version ? { version } : undefined;
  const response = await apiClient.get<{ data: AttributeSchema }>(
    `/verticals/${verticalType}/schema`,
    { params }
  );
  return response.data.data;
}
