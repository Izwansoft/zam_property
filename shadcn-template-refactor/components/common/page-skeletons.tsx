"use client";

// =============================================================================
// Page Skeletons â€” Reusable skeleton loading patterns for all page types
// =============================================================================
// Provides consistent loading state visuals across the application.
// Each skeleton mirrors the final rendered layout to prevent layout shift (CLS).
//
// Variants:
//   CardSkeleton       â€” Single card placeholder
//   CardGridSkeleton   â€” Grid of card placeholders
//   TableSkeleton      â€” Table with header + rows
//   ListSkeleton       â€” Vertical list items
//   FormSkeleton       â€” Form with fields and actions
//   PageShellSkeleton  â€” Page header + content area
//   DashboardSkeleton  â€” Stats cards + chart + table
//   DetailSkeleton     â€” Detail page with header, info sections, tabs
// =============================================================================

import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// CardSkeleton â€” Single card with image, title, subtitle, badges
// ---------------------------------------------------------------------------

export interface CardSkeletonProps {
  /** Show image placeholder at top */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Show badge row */
  showBadges?: boolean;
}

export function CardSkeleton({
  showImage = true,
  lines = 2,
  showBadges = true,
}: CardSkeletonProps = {}) {
  return (
    <div className="rounded-lg border p-4 space-y-3" aria-busy="true" aria-label="Loading card">
      {showImage && <Skeleton className="h-36 w-full rounded-md" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? "w-3/4" : "w-1/2"}`}
        />
      ))}
      {showBadges && (
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardGridSkeleton â€” Grid of card placeholders
// ---------------------------------------------------------------------------

export interface CardGridSkeletonProps {
  /** Number of cards to show */
  count?: number;
  /** Grid columns configuration */
  columns?: 2 | 3 | 4;
  /** Props forwarded to each CardSkeleton */
  cardProps?: CardSkeletonProps;
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  cardProps,
}: CardGridSkeletonProps = {}) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]}`} role="status" aria-busy="true" aria-label="Loading content">
      <span className="sr-only">Loading content, please wait.</span>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} {...cardProps} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TableSkeleton â€” Table header + row placeholders
// ---------------------------------------------------------------------------

export interface TableSkeletonProps {
  /** Number of columns */
  columns?: number;
  /** Number of rows */
  rows?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Show action column (narrower last column) */
  showActions?: boolean;
}

export function TableSkeleton({
  columns = 5,
  rows = 8,
  showHeader = true,
  showActions = true,
}: TableSkeletonProps = {}) {
  const effectiveCols = showActions ? columns - 1 : columns;

  return (
    <div className="rounded-lg border" role="status" aria-busy="true" aria-label="Loading table">
      <span className="sr-only">Loading table data, please wait.</span>
      {/* Toolbar placeholder */}
      <div className="flex items-center justify-between gap-4 border-b p-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      {/* Table */}
      <div className="p-4 space-y-0">
        {/* Header */}
        {showHeader && (
          <div className="flex gap-4 border-b pb-3 mb-1">
            {Array.from({ length: effectiveCols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
            {showActions && <Skeleton className="h-4 w-12" />}
          </div>
        )}
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b last:border-0"
          >
            {Array.from({ length: effectiveCols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
            {showActions && <Skeleton className="h-4 w-12" />}
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between border-t p-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListSkeleton â€” Vertical list item placeholders
// ---------------------------------------------------------------------------

export interface ListSkeletonProps {
  /** Number of list items */
  count?: number;
  /** Show avatar/icon placeholder */
  showAvatar?: boolean;
  /** Show secondary text line */
  showSecondary?: boolean;
}

export function ListSkeleton({
  count = 6,
  showAvatar = true,
  showSecondary = true,
}: ListSkeletonProps = {}) {
  return (
    <div className="space-y-1" role="status" aria-busy="true" aria-label="Loading list">
      <span className="sr-only">Loading list items, please wait.</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border p-4"
        >
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            {showSecondary && <Skeleton className="h-3 w-1/2" />}
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormSkeleton â€” Form field placeholders
// ---------------------------------------------------------------------------

export interface FormSkeletonProps {
  /** Number of single-column fields */
  fields?: number;
  /** Show a two-column row */
  showTwoColumnRow?: boolean;
  /** Show textarea field */
  showTextarea?: boolean;
  /** Show action buttons */
  showActions?: boolean;
}

export function FormSkeleton({
  fields = 4,
  showTwoColumnRow = true,
  showTextarea = false,
  showActions = true,
}: FormSkeletonProps = {}) {
  return (
    <div className="space-y-6 max-w-2xl" role="status" aria-busy="true" aria-label="Loading form">
      <span className="sr-only">Loading form, please wait.</span>
      {/* Form header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Single-column fields */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {/* Optional textarea */}
      {showTextarea && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Two-column row */}
      {showTwoColumnRow && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageShellSkeleton â€” Page header + generic content area
// ---------------------------------------------------------------------------

export interface PageShellSkeletonProps {
  /** Show breadcrumb placeholder */
  showBreadcrumb?: boolean;
  /** Show description below title */
  showDescription?: boolean;
  /** Show action buttons in header */
  showHeaderActions?: boolean;
  /** Content area variant */
  contentVariant?: "table" | "cards" | "list" | "detail" | "empty";
}

export function PageShellSkeleton({
  showBreadcrumb = false,
  showDescription = true,
  showHeaderActions = true,
  contentVariant = "table",
}: PageShellSkeletonProps = {}) {
  return (
    <div className="space-y-6 p-1" role="status" aria-busy="true" aria-label="Loading page">
      <span className="sr-only">Loading page content, please wait.</span>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          {showDescription && <Skeleton className="h-4 w-96" />}
        </div>
        {showHeaderActions && (
          <div className="flex gap-2 shrink-0">
            <Skeleton className="h-9 w-28" />
          </div>
        )}
      </div>

      {/* Content area */}
      {contentVariant === "table" && <TableSkeleton />}
      {contentVariant === "cards" && <CardGridSkeleton />}
      {contentVariant === "list" && <ListSkeleton />}
      {contentVariant === "detail" && <DetailSkeleton />}
      {contentVariant === "empty" && (
        <div className="rounded-lg border p-8">
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DashboardSkeleton â€” Stats cards + chart + recent items
// ---------------------------------------------------------------------------

export interface DashboardSkeletonProps {
  /** Number of stat cards */
  statCards?: number;
  /** Show chart section */
  showChart?: boolean;
  /** Show recent items table */
  showRecentItems?: boolean;
}

export function DashboardSkeleton({
  statCards = 4,
  showChart = true,
  showRecentItems = true,
}: DashboardSkeletonProps = {}) {
  return (
    <div className="space-y-6 p-1" role="status" aria-busy="true" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard data, please wait.</span>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Date range picker placeholder */}
        <Skeleton className="h-9 w-56" />
      </div>

      {/* Stats cards row */}
      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          statCards >= 4 ? "lg:grid-cols-4" : `lg:grid-cols-${statCards}`
        }`}
      >
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-20" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart section */}
      {showChart && (
        <div className="grid gap-4 lg:grid-cols-7">
          <div className="rounded-lg border p-6 lg:col-span-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="rounded-lg border p-6 lg:col-span-3 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full rounded-full mx-auto max-w-[256px]" />
          </div>
        </div>
      )}

      {/* Recent items */}
      {showRecentItems && (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-20" />
          </div>
          <TableSkeleton columns={4} rows={5} showActions={false} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailSkeleton â€” Entity detail page with header, meta, tabs, content
// ---------------------------------------------------------------------------

export interface DetailSkeletonProps {
  /** Show image/media gallery placeholder */
  showGallery?: boolean;
  /** Number of info fields */
  infoFields?: number;
  /** Show tabs */
  showTabs?: boolean;
  /** Number of tab items */
  tabCount?: number;
  /** Show sidebar */
  showSidebar?: boolean;
}

export function DetailSkeleton({
  showGallery = false,
  infoFields = 6,
  showTabs = true,
  tabCount = 4,
  showSidebar = true,
}: DetailSkeletonProps = {}) {
  return (
    <div className="space-y-6 p-1" role="status" aria-busy="true" aria-label="Loading details">
      <span className="sr-only">Loading detail view, please wait.</span>
      {/* Detail header with status + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Image gallery */}
      {showGallery && (
        <div className="grid gap-2 grid-cols-4">
          <Skeleton className="col-span-3 h-72 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-22 rounded-lg" />
            <Skeleton className="h-22 rounded-lg" />
            <Skeleton className="h-22 rounded-lg" />
          </div>
        </div>
      )}

      {/* Main content + sidebar */}
      <div className={`grid gap-6 ${showSidebar ? "lg:grid-cols-3" : ""}`}>
        {/* Main content */}
        <div className={`space-y-6 ${showSidebar ? "lg:col-span-2" : ""}`}>
          {/* Tabs */}
          {showTabs && (
            <div className="flex gap-4 border-b pb-1">
              {Array.from({ length: tabCount }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          )}

          {/* Info fields in 2-col grid */}
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: infoFields }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Description section */}
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="space-y-4">
            {/* Quick info card */}
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-5 w-28" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            {/* Activity card */}
            <div className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCardSkeleton â€” Single stat/metric card
// ---------------------------------------------------------------------------

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-20" />
      <div className="flex items-center gap-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

