/**
 * VisuallyHidden Component
 *
 * Renders content that is hidden visually but remains accessible
 * to screen readers. Uses Tailwind's `sr-only` utility.
 *
 * @example
 * ```tsx
 * <button>
 *   <TrashIcon aria-hidden="true" />
 *   <VisuallyHidden>Delete listing</VisuallyHidden>
 * </button>
 * ```
 *
 * @see WCAG 1.3.1 — Info and Relationships
 */

import React from 'react';

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  /** Render as a specific element (default: "span") */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
}: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}
