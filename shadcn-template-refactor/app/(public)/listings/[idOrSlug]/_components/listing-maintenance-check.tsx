/**
 * Listing Maintenance Check Component
 *
 * Client component that checks if the listing's vertical is under maintenance.
 * Mount this at the top of listing pages to show maintenance notice.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 */

"use client";

import { useMaintenanceStatus } from "@/modules/vertical";
import { MaintenancePage } from "@/modules/vertical";

interface ListingMaintenanceCheckProps {
  verticalType: string;
  children: React.ReactNode;
}

export function ListingMaintenanceCheck({
  verticalType,
  children,
}: ListingMaintenanceCheckProps) {
  const { data: status } = useMaintenanceStatus(verticalType);

  if (status?.isUnderMaintenance) {
    return <MaintenancePage status={status} />;
  }

  return <>{children}</>;
}
