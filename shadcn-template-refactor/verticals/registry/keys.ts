// verticals/registry/keys.ts — TanStack Query key factory for verticals

import { queryKeys } from "@/lib/query";

export const verticalKeys = {
  /** Root key for all vertical queries */
  all: queryKeys.verticals.all,

  /** Key for the verticals list */
  list: () => queryKeys.verticals.list(),

  /** Key for a single vertical schema */
  schema: (verticalType: string) => queryKeys.verticals.schema(verticalType),

  /** Key for a versioned schema */
  schemaVersioned: (verticalType: string, version: string) =>
    [...queryKeys.verticals.schema(verticalType), version] as const,
};
