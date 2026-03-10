/**
 * AccessibleField Component
 *
 * A form field wrapper that ensures proper label association,
 * error announcement, and ARIA attributes for accessibility.
 *
 * @example
 * ```tsx
 * <AccessibleField
 *   label="Email"
 *   name="email"
 *   required
 *   error={errors.email?.message}
 *   helpText="We'll never share your email"
 * >
 *   {(fieldProps) => <Input {...fieldProps} type="email" />}
 * </AccessibleField>
 * ```
 *
 * @see WCAG 1.3.1 — Info and Relationships
 * @see WCAG 3.3.2 — Labels or Instructions
 */
'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface AccessibleFieldProps {
  /** Field label text */
  label: string;
  /** Field name for ID generation */
  name: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Help text / description */
  helpText?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS class on the wrapper */
  className?: string;
  /** Render function receives computed ARIA props to spread on the input */
  children: (fieldProps: AccessibleFieldInputProps) => React.ReactNode;
}

export interface AccessibleFieldInputProps {
  id: string;
  name: string;
  'aria-invalid': boolean;
  'aria-required': boolean | undefined;
  'aria-describedby': string | undefined;
  'aria-disabled': boolean | undefined;
  disabled: boolean | undefined;
}

export function AccessibleField({
  label,
  name,
  required,
  error,
  helpText,
  disabled,
  className,
  children,
}: AccessibleFieldProps) {
  const generatedId = useId();
  const inputId = `field-${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  // Build aria-describedby from available descriptions
  const describedBy = [
    helpText ? helpId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  const fieldProps: AccessibleFieldInputProps = {
    id: inputId,
    name,
    'aria-invalid': !!error,
    'aria-required': required || undefined,
    'aria-describedby': describedBy,
    'aria-disabled': disabled || undefined,
    disabled,
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId} className={cn(error && 'text-destructive')}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </Label>

      {children(fieldProps)}

      {helpText && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive font-medium"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
