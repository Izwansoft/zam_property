// =============================================================================
// FeatureGate — Conditionally render children based on feature flag
// =============================================================================
// Usage: <FeatureGate flag="my-feature">Protected content</FeatureGate>
// =============================================================================

"use client";

import { type ReactNode } from "react";
import { useCheckFeatureFlag } from "../hooks/use-check-feature-flag";

export interface FeatureGateProps {
  /** The feature flag key to check */
  flag: string;
  /** Content to render when the flag is enabled */
  children: ReactNode;
  /** Optional fallback to render when the flag is disabled */
  fallback?: ReactNode;
  /** Optional loading indicator while checking */
  loadingFallback?: ReactNode;
}

/**
 * Conditionally renders children based on a feature flag's state.
 *
 * Uses the runtime check endpoint (GET /feature-flags/check) which works
 * for any authenticated role. Results are cached for 5 minutes.
 *
 * @example
 * ```tsx
 * <FeatureGate flag="new-search">
 *   <NewSearchComponent />
 * </FeatureGate>
 *
 * <FeatureGate flag="beta-feature" fallback={<OldFeature />}>
 *   <NewFeature />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
  loadingFallback = null,
}: FeatureGateProps) {
  const { enabled, loading } = useCheckFeatureFlag(flag);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  return <>{enabled ? children : fallback}</>;
}
