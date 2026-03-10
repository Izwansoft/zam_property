/**
 * Maintenance Guard Component
 *
 * Wraps content and shows maintenance page if the vertical is under maintenance.
 * Use this in layout or page components for vertical-specific routes.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 *
 * @example
 * ```tsx
 * // In property layout
 * export default function PropertyLayout({ children }) {
 *   return (
 *     <MaintenanceGuard verticalType="real_estate">
 *       {children}
 *     </MaintenanceGuard>
 *   );
 * }
 * ```
 */

"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useMaintenanceStatus } from "../hooks/use-maintenance";
import { MaintenancePage } from "./maintenance-page";

// =============================================================================
// Types
// =============================================================================

interface MaintenanceGuardProps {
  /** The vertical type to check (e.g., 'real_estate', 'automotive') */
  verticalType: string;
  /** Children to render if not under maintenance */
  children: ReactNode;
  /** Show loading state while checking (default: true) */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Disable the guard (useful for development) */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function MaintenanceGuard({
  verticalType,
  children,
  showLoading = true,
  loadingComponent,
  disabled = false,
}: MaintenanceGuardProps) {
  const { data: status, isLoading, refetch } = useMaintenanceStatus(verticalType, {
    enabled: !disabled,
  });

  // Guard disabled
  if (disabled) {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Checking availability...</p>
        </div>
      </div>
    );
  }

  // Under maintenance
  if (status?.isUnderMaintenance) {
    return <MaintenancePage status={status} onRetry={() => refetch()} />;
  }

  // Normal render
  return <>{children}</>;
}

export default MaintenanceGuard;
