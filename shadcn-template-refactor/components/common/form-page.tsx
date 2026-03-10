"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, type PageHeaderProps } from "@/components/common/page-header";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Section content (form fields) */
  content: React.ReactNode;
  /** Custom className */
  className?: string;
}

export interface FormPageAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Button type (submit, button, reset) */
  type?: "submit" | "button" | "reset";
}

export interface FormPageProps
  extends Omit<PageHeaderProps, "children" | "actions" | "loading"> {
  /** Whether data is loading */
  loading?: boolean;
  /** Whether the form is submitting */
  submitting?: boolean;
  /** Form sections */
  sections?: FormSection[];
  /** Form content (used when not using sections) */
  children?: React.ReactNode;
  /** Sticky footer actions */
  formActions?: FormPageAction[];
  /** Cancel action — defaults to router.back() */
  onCancel?: () => void;
  /** Cancel button label */
  cancelLabel?: string;
  /** Hide cancel button */
  hideCancel?: boolean;
  /** Whether to show a sticky footer action bar */
  stickyActions?: boolean;
  /** Form element onSubmit handler — wraps content in <form> */
  onSubmit?: (e: React.FormEvent) => void;
  /** Whether form content is wrapped in a Card */
  card?: boolean;
  /** Optional aside content for the form (e.g., preview, tips) */
  aside?: React.ReactNode;
  /** Error state content */
  errorState?: React.ReactNode;
  /** Whether an error occurred */
  hasError?: boolean;
  /** Custom className for the content area */
  contentClassName?: string;
  /** Whether the form has unsaved changes */
  isDirty?: boolean;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function FormPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mock header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
      {/* Mock form sections */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ))}
      </div>
      {/* Mock actions */}
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Renderer
// ---------------------------------------------------------------------------

function FormSectionRenderer({
  sections,
}: {
  sections: FormSection[];
}) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          {index > 0 && <Separator />}
          <div className={cn("space-y-4", section.className)}>
            <div>
              <h2 className="text-base font-semibold">{section.title}</h2>
              {section.description && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {section.description}
                </p>
              )}
            </div>
            {section.content}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action Bar
// ---------------------------------------------------------------------------

function ActionBar({
  formActions,
  onCancel,
  cancelLabel,
  hideCancel,
  submitting,
  sticky,
  isDirty,
}: {
  formActions: FormPageAction[];
  onCancel?: () => void;
  cancelLabel: string;
  hideCancel: boolean;
  submitting: boolean;
  sticky: boolean;
  isDirty?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t pt-4",
        sticky &&
          "bg-background/95 sticky bottom-0 z-10 -mx-4 px-4 pb-4 backdrop-blur-sm",
      )}
    >
      {/* Unsaved changes indicator */}
      {isDirty && (
        <span className="text-muted-foreground mr-auto text-sm">
          Unsaved changes
        </span>
      )}

      {/* Cancel */}
      {!hideCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          {cancelLabel}
        </Button>
      )}

      {/* Custom actions */}
      {formActions.map((action) => (
        <Button
          key={action.label}
          type={action.type ?? "button"}
          variant={action.variant ?? "default"}
          onClick={action.type === "submit" ? undefined : action.onClick}
          disabled={action.disabled || action.loading || submitting}
        >
          {action.loading || (action.type === "submit" && submitting)
            ? "Saving..."
            : action.label}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * FormPage template — consistent create/edit form layout.
 *
 * Follows Part-5 §5.4(C):
 * - Header: title + status
 * - Form sections grouped logically
 * - Inline validation errors
 * - Sticky action bar: Save draft, Save, Publish (if allowed)
 * - Cancel returns to last safe page
 *
 * Usage modes:
 * 1. Sections mode: Pass `sections` for auto-structured form
 * 2. Freeform mode: Pass `children` for custom form content
 *
 * If `onSubmit` is provided, content is wrapped in a `<form>` element.
 */
export function FormPage({
  // PageHeader props
  title,
  description,
  status,
  icon,
  backHref,
  onBack,
  breadcrumbOverrides,
  hideBreadcrumb,
  // FormPage-specific props
  loading = false,
  submitting = false,
  sections,
  children,
  formActions = [],
  onCancel,
  cancelLabel = "Cancel",
  hideCancel = false,
  stickyActions = true,
  onSubmit,
  card = true,
  aside,
  errorState,
  hasError = false,
  contentClassName,
  isDirty,
}: FormPageProps) {
  const router = useRouter();

  const handleCancel = onCancel ?? (() => router.back());

  if (loading) {
    return <FormPageSkeleton />;
  }

  if (hasError && errorState) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={title}
          description={description}
          status={status}
          icon={icon}
          backHref={backHref}
          onBack={onBack}
          breadcrumbOverrides={breadcrumbOverrides}
          hideBreadcrumb={hideBreadcrumb}
        />
        {errorState}
      </div>
    );
  }

  // Build form content
  let formContent: React.ReactNode;
  if (sections && sections.length > 0) {
    formContent = <FormSectionRenderer sections={sections} />;
  } else {
    formContent = children;
  }

  // Wrap in a card if requested
  if (card) {
    formContent = (
      <Card>
        <CardContent className="pt-6">{formContent}</CardContent>
      </Card>
    );
  }

  // Actions bar
  const actionsBar = formActions.length > 0 || !hideCancel ? (
    <ActionBar
      formActions={formActions}
      onCancel={handleCancel}
      cancelLabel={cancelLabel}
      hideCancel={hideCancel}
      submitting={submitting}
      sticky={stickyActions}
      isDirty={isDirty}
    />
  ) : null;

  // Full body content
  const bodyContent = (
    <>
      {aside ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-6 lg:grid-cols-3",
            contentClassName,
          )}
        >
          <div className="lg:col-span-2">{formContent}</div>
          <div>{aside}</div>
        </div>
      ) : (
        <div className={cn("mx-auto max-w-3xl", contentClassName)}>
          {formContent}
        </div>
      )}
      {actionsBar}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        status={status}
        icon={icon}
        backHref={backHref}
        onBack={onBack}
        breadcrumbOverrides={breadcrumbOverrides}
        hideBreadcrumb={hideBreadcrumb}
      />

      {/* Form content — optionally wrapped in <form> */}
      {onSubmit ? (
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {bodyContent}
        </form>
      ) : (
        <div className="space-y-6">{bodyContent}</div>
      )}
    </div>
  );
}
