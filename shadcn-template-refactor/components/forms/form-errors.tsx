'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// FormRootError — Prominent root-level error banner
// ---------------------------------------------------------------------------

export interface FormRootErrorProps {
  /** Error message to display */
  message?: string | null;
  /** Extra className */
  className?: string;
}

export function FormRootError({ message, className }: FormRootErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border border-destructive/20 px-4 py-3 text-sm',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormErrorSummary — Lists all current validation errors
// ---------------------------------------------------------------------------

export interface FormErrorSummaryProps {
  /** Override title text */
  title?: string;
  /** Extra className */
  className?: string;
}

export function FormErrorSummary({
  title = 'Please fix the following errors:',
  className,
}: FormErrorSummaryProps) {
  const {
    formState: { errors },
  } = useFormContext();

  // Flatten nested errors into a label → message list
  const errorEntries = React.useMemo(() => {
    const entries: { field: string; message: string }[] = [];

    function walk(obj: Record<string, unknown>, prefix = '') {
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (
          val &&
          typeof val === 'object' &&
          'message' in val &&
          typeof (val as { message: unknown }).message === 'string'
        ) {
          entries.push({
            field: path,
            message: (val as { message: string }).message,
          });
        } else if (val && typeof val === 'object') {
          walk(val as Record<string, unknown>, path);
        }
      }
    }

    walk(errors as Record<string, unknown>);
    return entries;
  }, [errors]);

  if (errorEntries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'bg-destructive/10 rounded-md border border-destructive/20 px-4 py-3',
        className,
      )}
    >
      <div className="text-destructive mb-2 flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{title}</span>
      </div>
      <ul className="text-destructive/90 list-disc space-y-1 pl-6 text-sm">
        {errorEntries.map(({ field, message }) => (
          <li key={field}>
            <span className="font-medium capitalize">
              {formatFieldName(field)}
            </span>
            {': '}
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldError — Standalone inline field error (for non-RHF contexts)
// ---------------------------------------------------------------------------

export interface FieldErrorProps {
  /** Error message */
  message?: string | null;
  /** Extra className */
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn('text-destructive text-sm', className)}
    >
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a dot-path field name to a human-friendly label.
 * e.g. "address.zipCode" → "Address Zip Code"
 */
function formatFieldName(field: string): string {
  return field
    .split('.')
    .map((segment) =>
      segment
        // Split camelCase
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Capitalize first letter
        .replace(/^./, (c) => c.toUpperCase()),
    )
    .join(' ');
}
