/**
 * AccessibleButton Component
 *
 * An enhanced button wrapper that ensures proper accessibility:
 * - Icon-only buttons get an aria-label
 * - Loading state uses aria-busy
 * - Confirmation buttons have aria-describedby for warning text
 * - Minimum touch target size (44x44px)
 *
 * @example
 * ```tsx
 * // Icon-only button
 * <AccessibleButton label="Delete listing" variant="destructive" size="icon">
 *   <TrashIcon />
 * </AccessibleButton>
 *
 * // Loading button
 * <AccessibleButton loading loadingLabel="Saving...">
 *   Save Changes
 * </AccessibleButton>
 *
 * // Button with description
 * <AccessibleButton
 *   label="Publish listing"
 *   description="This will make the listing visible to the public"
 * >
 *   Publish
 * </AccessibleButton>
 * ```
 *
 * @see WCAG 4.1.2 — Name, Role, Value
 * @see WCAG 2.5.5 — Target Size
 */
'use client';

import React, { useId, forwardRef } from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Accessible label for icon-only buttons */
  label?: string;
  /** Additional description (rendered as visually hidden text linked via aria-describedby) */
  description?: string;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Accessible label while loading (default: "Loading…") */
  loadingLabel?: string;
  /** Whether to render as a child component (Slot pattern) */
  asChild?: boolean;
  children?: React.ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  function AccessibleButton(
    {
      label,
      description,
      loading = false,
      loadingLabel = 'Loading\u2026',
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const descId = useId();
    const isDisabled = disabled || loading;

    return (
      <>
        <Button
          ref={ref}
          aria-label={loading ? loadingLabel : label}
          aria-busy={loading || undefined}
          aria-disabled={isDisabled || undefined}
          aria-describedby={description ? descId : undefined}
          disabled={isDisabled}
          className={cn(
            // Ensure minimum touch target for icon-only buttons
            props.size === 'icon' && 'min-h-[44px] min-w-[44px]',
            className,
          )}
          {...props}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">{loadingLabel}</span>
              {children}
            </>
          ) : (
            children
          )}
        </Button>
        {description && (
          <span id={descId} className="sr-only">
            {description}
          </span>
        )}
      </>
    );
  },
);
