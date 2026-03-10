// =============================================================================
// Optimistic Update Utilities — Helpers for TanStack Query optimistic updates
// =============================================================================
// Provides reusable patterns for optimistic mutations that update the UI
// instantly and rollback on failure.
//
// Usage:
//   const mutation = useMutation({
//     onMutate: optimisticListUpdate(queryClient, queryKey, (old, vars) => ({
//       ...old,
//       items: old.items.map(item =>
//         item.id === vars.id ? { ...item, status: "APPROVED" } : item
//       ),
//     })),
//     onError: rollbackOptimistic(queryClient, queryKey),
//     onSettled: settleOptimistic(queryClient, queryKey),
//   });
// =============================================================================

import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { NormalizedPaginatedResult } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimisticContext<TData> {
  /** Snapshot of data before optimistic update */
  previousData: TData | undefined;
}

// ---------------------------------------------------------------------------
// Single-Item Optimistic Update
// ---------------------------------------------------------------------------

/**
 * Creates an `onMutate` handler that optimistically updates a single item
 * in the query cache and returns a rollback context.
 *
 * @example
 * ```ts
 * onMutate: optimisticDetailUpdate<Vendor, string>(
 *   queryClient,
 *   queryKeys.vendors.detail(partnerKey, vendorId),
 *   (old, _vars) => ({ ...old, status: "APPROVED" }),
 * ),
 * ```
 */
export function optimisticDetailUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (currentData: TData, variables: TVariables) => TData,
) {
  return async (
    variables: TVariables,
  ): Promise<OptimisticContext<TData>> => {
    // Cancel any outgoing refetches to avoid overwriting our optimistic update
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = queryClient.getQueryData<TData>(queryKey);

    // Optimistically update the cache
    if (previousData) {
      queryClient.setQueryData<TData>(queryKey, (old) =>
        old ? updater(old, variables) : old,
      );
    }

    return { previousData };
  };
}

// ---------------------------------------------------------------------------
// List Optimistic Update
// ---------------------------------------------------------------------------

/**
 * Creates an `onMutate` handler that optimistically updates an item
 * within a paginated list result.
 *
 * @example
 * ```ts
 * onMutate: optimisticListItemUpdate<Listing, string>(
 *   queryClient,
 *   queryKeys.listings.list(partnerKey, params),
 *   (item, _vars) => ({ ...item, status: "PUBLISHED" }),
 *   (item, vars) => item.id === vars, // match function
 * ),
 * ```
 */
export function optimisticListItemUpdate<TItem, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemUpdater: (item: TItem, variables: TVariables) => TItem,
  matcher: (item: TItem, variables: TVariables) => boolean,
) {
  return async (
    variables: TVariables,
  ): Promise<OptimisticContext<NormalizedPaginatedResult<TItem>>> => {
    await queryClient.cancelQueries({ queryKey });

    const previousData =
      queryClient.getQueryData<NormalizedPaginatedResult<TItem>>(queryKey);

    if (previousData) {
      queryClient.setQueryData<NormalizedPaginatedResult<TItem>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              matcher(item, variables)
                ? itemUpdater(item, variables)
                : item,
            ),
          };
        },
      );
    }

    return { previousData };
  };
}

// ---------------------------------------------------------------------------
// List Item Removal (optimistic delete)
// ---------------------------------------------------------------------------

/**
 * Creates an `onMutate` handler that optimistically removes an item
 * from a paginated list.
 *
 * @example
 * ```ts
 * onMutate: optimisticListItemRemove<Listing, string>(
 *   queryClient,
 *   queryKeys.listings.list(partnerKey, params),
 *   (item, vars) => item.id === vars,
 * ),
 * ```
 */
export function optimisticListItemRemove<TItem, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  matcher: (item: TItem, variables: TVariables) => boolean,
) {
  return async (
    variables: TVariables,
  ): Promise<OptimisticContext<NormalizedPaginatedResult<TItem>>> => {
    await queryClient.cancelQueries({ queryKey });

    const previousData =
      queryClient.getQueryData<NormalizedPaginatedResult<TItem>>(queryKey);

    if (previousData) {
      queryClient.setQueryData<NormalizedPaginatedResult<TItem>>(
        queryKey,
        (old) => {
          if (!old) return old;
          const filtered = old.items.filter(
            (item) => !matcher(item, variables),
          );
          return {
            ...old,
            items: filtered,
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        },
      );
    }

    return { previousData };
  };
}

// ---------------------------------------------------------------------------
// Rollback & Settle Helpers
// ---------------------------------------------------------------------------

/**
 * Creates an `onError` handler that restores the previous cache state.
 * Use with the context returned from optimistic update `onMutate`.
 *
 * @example
 * ```ts
 * onError: (_err, _vars, context) =>
 *   rollbackOptimistic(queryClient, queryKey)(context),
 * ```
 */
export function rollbackOptimistic<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return (context: OptimisticContext<TData> | undefined) => {
    if (context?.previousData !== undefined) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  };
}

/**
 * Creates an `onSettled` handler that always refetches the query
 * to ensure server state is synchronized.
 *
 * @example
 * ```ts
 * onSettled: settleOptimistic(queryClient, queryKey),
 * ```
 */
export function settleOptimistic(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return () => {
    queryClient.invalidateQueries({ queryKey });
  };
}

// ---------------------------------------------------------------------------
// Convenience: Composed optimistic mutation options
// ---------------------------------------------------------------------------

/**
 * Returns `onMutate`, `onError`, and `onSettled` for a detail optimistic update.
 * Spread these into your useMutation options.
 *
 * @example
 * ```ts
 * const optimistic = useOptimisticDetail(
 *   queryClient,
 *   queryKeys.vendors.detail(partnerKey, vendorId),
 *   (old, _vars) => ({ ...old, status: "APPROVED" }),
 * );
 *
 * const mutation = useMutation({
 *   ...optimistic,
 *   mutationFn: ...,
 * });
 * ```
 */
export function composeOptimisticDetail<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (currentData: TData, variables: TVariables) => TData,
) {
  return {
    onMutate: optimisticDetailUpdate<TData, TVariables>(
      queryClient,
      queryKey,
      updater,
    ),
    onError: (
      _error: unknown,
      _variables: TVariables,
      context: OptimisticContext<TData> | undefined,
    ) => {
      rollbackOptimistic<TData>(queryClient, queryKey)(context);
    },
    onSettled: settleOptimistic(queryClient, queryKey),
  };
}
