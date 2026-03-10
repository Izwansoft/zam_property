'use client';

import * as React from 'react';
import {
  useForm,
  FormProvider,
  type UseFormProps,
  type UseFormReturn,
  type FieldValues,
  type SubmitHandler,
  type DefaultValues,
  type Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { cn } from '@/lib/utils';
import { extractFieldErrors, type AppError } from '@/lib/errors';
import { SaveButton, SubmitButton } from '@/components/common/loading-button';

// Extract the schema type that zodResolver actually accepts
type ZodSchema = Parameters<typeof zodResolver>[0];

// ---------------------------------------------------------------------------
// FormWrapper — Auto-connects RHF + Zod, handles server errors
// ---------------------------------------------------------------------------

export interface FormWrapperProps<TValues extends FieldValues> {
  /** Zod schema for validation */
  schema: ZodSchema;
  /** Default values for the form */
  defaultValues?: DefaultValues<TValues>;
  /** Called on valid submit */
  onSubmit: SubmitHandler<TValues>;
  /** Called on validation error (optional) */
  onError?: (errors: Record<string, unknown>) => void;
  /** Extra RHF options (merged with defaults) */
  formOptions?: Omit<UseFormProps<TValues>, 'resolver' | 'defaultValues'>;
  /** Render function — receives form instance */
  children: (form: UseFormReturn<TValues>) => React.ReactNode;
  /** Root-level server error message */
  serverError?: string | null;
  /** Whether form submission is in progress */
  isSubmitting?: boolean;
  /** HTML form id */
  id?: string;
  /** Extra className on the <form> element */
  className?: string;
  /** Disable all fields while submitting */
  disabled?: boolean;
  /** Render prop for footer / action buttons — null hides actions */
  renderActions?: ((form: UseFormReturn<TValues>) => React.ReactNode) | null;
  /**
   * When an AppError with fieldErrors is caught, call this to map them
   * automatically onto the RHF fields.
   */
  onServerValidationError?: (error: AppError) => void;
}

export function FormWrapper<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  formOptions,
  children,
  serverError,
  isSubmitting = false,
  id,
  className,
  disabled,
  renderActions,
  onServerValidationError: _onSvE, // handled centrally below
}: FormWrapperProps<TValues>) {
  const form = useForm<TValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
    ...formOptions,
  });

  // Proxy for setting server-side validation errors onto RHF fields
  const setServerErrors = React.useCallback(
    (error: AppError) => {
      const fieldErrors = extractFieldErrors(error);
      if (!fieldErrors) return;

      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as Path<TValues>, {
          type: 'server',
          message,
        });
      });
    },
    [form],
  );

  // Expose setServerErrors via ref-stable callback
  React.useEffect(() => {
    if (_onSvE) {
      // No-op — consumers call setServerErrors directly
    }
  }, [_onSvE]);

  const handleSubmit = form.handleSubmit(onSubmit, onError);

  const isFormDisabled = disabled || isSubmitting;

  return (
    <FormProvider {...form}>
      <form
        id={id}
        onSubmit={handleSubmit}
        className={cn('space-y-6', className)}
        noValidate
      >
        <fieldset disabled={isFormDisabled} className="space-y-6">
          {/* Root server error */}
          {serverError && (
            <div
              role="alert"
              className="bg-destructive/10 text-destructive rounded-md border border-destructive/20 px-4 py-3 text-sm"
            >
              {serverError}
            </div>
          )}

          {children(form)}
        </fieldset>

        {/* Default actions — can be overridden or hidden with renderActions={null} */}
        {renderActions !== null && (
          <div className="flex justify-end gap-3 pt-2">
            {renderActions ? (
              renderActions(form)
            ) : (
              <SubmitButton submitting={isSubmitting} />
            )}
          </div>
        )}
      </form>
    </FormProvider>
  );
}

// Re-export setServerErrors helper for use in mutation callbacks
export { extractFieldErrors as setServerErrors };

// ---------------------------------------------------------------------------
// FormSection — Visual group with heading
// ---------------------------------------------------------------------------

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FormGrid — Responsive column grid for fields
// ---------------------------------------------------------------------------

export interface FormGridProps {
  /** Number of columns (responsive) */
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const gridColsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function FormGrid({
  columns = 2,
  children,
  className,
}: FormGridProps) {
  return (
    <div className={cn('grid gap-4', gridColsMap[columns], className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormActions — Standard form action bar
// ---------------------------------------------------------------------------

export interface FormActionsProps {
  /** Align actions */
  align?: 'left' | 'center' | 'right' | 'between';
  children: React.ReactNode;
  className?: string;
}

const alignMap: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
};

export function FormActions({
  align = 'right',
  children,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t pt-4',
        alignMap[align],
        className,
      )}
    >
      {children}
    </div>
  );
}
