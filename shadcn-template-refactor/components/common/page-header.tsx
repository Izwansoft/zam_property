"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AutoBreadcrumb,
  type BreadcrumbOverride,
} from "@/components/common/auto-breadcrumb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Lucide icon */
  icon?: LucideIcon;
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface StatusBadge {
  /** Badge text */
  label: string;
  /** Badge variant */
  variant?: NonNullable<
    React.ComponentProps<typeof Badge>["variant"]
  >;
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Optional status badge next to the title */
  status?: StatusBadge;
  /** Optional icon shown before the title */
  icon?: LucideIcon;
  /** Primary actions shown on the right side */
  actions?: PageAction[];
  /** Show a back button */
  backHref?: string;
  /** Custom back button handler (overrides backHref) */
  onBack?: () => void;
  /** Breadcrumb overrides (passed to AutoBreadcrumb) */
  breadcrumbOverrides?: BreadcrumbOverride[];
  /** Hide breadcrumb */
  hideBreadcrumb?: boolean;
  /** Additional content below the title row (e.g., tabs, filter chips) */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Whether the header content is loading */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-busy="true" aria-label="Loading page header">
      <span className="sr-only">Loading page header, please wait.</span>
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Standard page header used across all portal pages.
 *
 * Provides:
 * - Auto breadcrumb (with override support for dynamic segments)
 * - Title with optional icon and status badge
 * - Optional description
 * - Action buttons (primary/secondary)
 * - Optional back button
 * - Slot for additional content (tabs, filters, etc.)
 *
 * Follows Part-5 §5.4 page patterns:
 * - List Page: title + breadcrumb + primary action
 * - Detail Page: title + status badge + key actions
 * - Form Page: title + status
 */
export function PageHeader({
  title,
  description,
  status,
  icon: Icon,
  actions = [],
  backHref,
  onBack,
  breadcrumbOverrides,
  hideBreadcrumb = true,
  children,
  className,
  loading = false,
}: PageHeaderProps) {
  const router = useRouter();

  if (loading) {
    return <PageHeaderSkeleton className={className} />;
  }

  const handleBack = onBack ?? (backHref ? () => router.push(backHref) : undefined);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb */}
      {!hideBreadcrumb && (
        <AutoBreadcrumb overrides={breadcrumbOverrides} />
      )}

      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {handleBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
          )}

          {/* Icon */}
          {Icon && (
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg" aria-hidden="true">
              <Icon className="text-muted-foreground size-5" />
            </div>
          )}

          {/* Title + description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {title}
              </h1>
              {status && (
                <Badge variant={status.variant ?? "secondary"} aria-label={`Status: ${status.label}`}>
                  {status.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground mt-0.5 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? "default"}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                size="sm"
                aria-busy={action.loading || undefined}
              >
                {action.icon && <action.icon className="mr-1.5 size-4" aria-hidden="true" />}
                {action.loading ? "Loading..." : action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Additional content (tabs, filters, etc.) */}
      {children}
    </div>
  );
}

export { PageHeaderSkeleton };
