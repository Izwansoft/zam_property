/**
 * Property Section Layout
 *
 * Layout wrapper for all property (real estate) pages.
 * Includes MaintenanceGuard to block access during maintenance.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 */

"use client";

import { ReactNode } from "react";
import { MaintenanceGuard } from "@/modules/vertical";

// =============================================================================
// LAYOUT
// =============================================================================

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return (
    <MaintenanceGuard verticalType="real_estate">
      {children}
    </MaintenanceGuard>
  );
}
