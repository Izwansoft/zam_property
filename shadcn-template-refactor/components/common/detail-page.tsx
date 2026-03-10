"use client";

import React from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, type PageHeaderProps } from "@/components/common/page-header";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetailTab {
  /** Tab identifier (used as value) */
  id: string;
  /** Display label */
  label: string;
  /** Tab content */
  content: React.ReactNode;
  /** Badge text shown on the tab */
  badge?: string;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface DetailSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: React.ReactNode;
  /** Optional description below the title */
  description?: string;
  /** Custom className */
  className?: string;
  /** Wrap content in a Card */
  card?: boolean;
}

export interface DetailPageProps
  extends Omit<PageHeaderProps, "children" | "loading"> {
  /** Whether data is loading */
  loading?: boolean;
  /** Tab configuration (mutually exclusive with sections) */
  tabs?: DetailTab[];
  /** Default active tab id */
  defaultTab?: string;
  /** Content sections (used when not using tabs) */
  sections?: DetailSection[];
  /** Right rail / sidebar content */
  aside?: React.ReactNode;
  /** Whether the aside is wide */
  asideWide?: boolean;
  /** Error state content */
  errorState?: React.ReactNode;
  /** Whether an error occurred */
  hasError?: boolean;
  /** Children — freeform content (used when neither tabs nor sections) */
  children?: React.ReactNode;
  /** Custom className for the content area */
  contentClassName?: string;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mock header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Mock tabs */}
      <Skeleton className="h-9 w-96" />
      {/* Mock content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Renderer
// ---------------------------------------------------------------------------

function SectionRenderer({ sections }: { sections: DetailSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const content = (
          <>
            {section.description && (
              <p className="text-muted-foreground mb-4 text-sm">
                {section.description}
              </p>
            )}
            {section.content}
          </>
        );

        if (section.card) {
          return (
            <Card key={section.id} className={section.className}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>{content}</CardContent>
            </Card>
          );
        }

        return (
          <div key={section.id} className={cn("space-y-3", section.className)}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {content}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DetailPage template — consistent entity detail page layout.
 *
 * Follows Part-5 §5.4(B):
 * - Header: entity title + status badge + key actions
 * - Tabs or sections for content organization
 * - Optional right rail for metadata/quick actions
 * - Safe destructive actions with confirmation
 *
 * Layout modes:
 * 1. Tabs mode: Pass `tabs` prop for tabbed content
 * 2. Sections mode: Pass `sections` prop for stacked sections
 * 3. Freeform mode: Pass `children` for custom content
 *
 * All modes support an optional `aside` (right rail).
 */
export function DetailPage({
  // PageHeader props
  title,
  description,
  status,
  icon,
  actions,
  backHref,
  onBack,
  breadcrumbOverrides,
  hideBreadcrumb,
  // DetailPage-specific props
  loading = false,
  tabs,
  defaultTab,
  sections,
  aside,
  asideWide = false,
  errorState,
  hasError = false,
  children,
  contentClassName,
}: DetailPageProps) {
  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (hasError && errorState) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={title}
          description={description}
          status={status}
          icon={icon}
          actions={actions}
          backHref={backHref}
          onBack={onBack}
          breadcrumbOverrides={breadcrumbOverrides}
          hideBreadcrumb={hideBreadcrumb}
        />
        {errorState}
      </div>
    );
  }

  // Determine main content
  let mainContent: React.ReactNode;

  if (tabs && tabs.length > 0) {
    mainContent = (
      <Tabs defaultValue={defaultTab ?? tabs[0].id}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
            >
              {tab.label}
              {tab.badge && (
                <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    );
  } else if (sections && sections.length > 0) {
    mainContent = <SectionRenderer sections={sections} />;
  } else {
    mainContent = children;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        status={status}
        icon={icon}
        actions={actions}
        backHref={backHref}
        onBack={onBack}
        breadcrumbOverrides={breadcrumbOverrides}
        hideBreadcrumb={hideBreadcrumb}
      />

      {/* Content with optional aside */}
      {aside ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            asideWide
              ? "lg:grid-cols-5"
              : "lg:grid-cols-3",
            contentClassName,
          )}
        >
          <div className={asideWide ? "lg:col-span-3" : "lg:col-span-2"}>
            {mainContent}
          </div>
          <div className={asideWide ? "lg:col-span-2" : "lg:col-span-1"}>
            {aside}
          </div>
        </div>
      ) : (
        <div className={contentClassName}>{mainContent}</div>
      )}
    </div>
  );
}
