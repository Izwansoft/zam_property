'use client';

import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

// ---------------------------------------------------------------------------
// Shared option type
// ---------------------------------------------------------------------------

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Base props shared by all field wrappers
// ---------------------------------------------------------------------------

interface BaseFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> {
  /** Field name — must match Zod schema keys */
  name: TName;
  /** Label shown above the field */
  label?: string;
  /** Helper text below the field */
  description?: string;
  /** Explicit control (optional — falls back to FormContext) */
  control?: Control<TValues>;
  /** Extra className on FormItem wrapper */
  className?: string;
  /** Whether the field is required (adds visual indicator) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

export interface TextFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  autoComplete?: string;
  maxLength?: number;
  inputClassName?: string;
}

export function TextField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  placeholder,
  type = 'text',
  autoComplete,
  maxLength,
  inputClassName,
}: TextFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              maxLength={maxLength}
              disabled={disabled}
              className={inputClassName}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// PasswordField
// ---------------------------------------------------------------------------

export interface PasswordFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  placeholder?: string;
  autoComplete?: string;
  inputClassName?: string;
}

export function PasswordField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  placeholder,
  autoComplete,
  inputClassName,
}: PasswordFieldProps<TValues, TName>) {
  const [visible, setVisible] = React.useState(false);
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                className={cn('pr-10', inputClassName)}
                value={field.value ?? ''}
              />
              <button
                type="button"
                tabIndex={-1}
                className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
              >
                {visible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// NumberField
// ---------------------------------------------------------------------------

export interface NumberFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  inputClassName?: string;
  /** Prefix (e.g. "RM") */
  prefix?: string;
  /** Suffix (e.g. "sq ft") */
  suffix?: string;
}

export function NumberField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  placeholder,
  min,
  max,
  step,
  inputClassName,
  prefix,
  suffix,
}: NumberFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative flex items-center">
              {prefix && (
                <span className="text-muted-foreground absolute left-3 text-sm">
                  {prefix}
                </span>
              )}
              <Input
                {...field}
                type="number"
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                  prefix && 'pl-10',
                  suffix && 'pr-14',
                  inputClassName,
                )}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? undefined : Number(val));
                }}
                value={field.value ?? ''}
              />
              {suffix && (
                <span className="text-muted-foreground absolute right-3 text-sm">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// TextAreaField
// ---------------------------------------------------------------------------

export interface TextAreaFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  textareaClassName?: string;
}

export function TextAreaField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  placeholder,
  rows = 4,
  maxLength,
  showCount,
  textareaClassName,
}: TextAreaFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const charCount = (field.value as string)?.length ?? 0;
        return (
          <FormItem className={className}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Textarea
                {...field}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                disabled={disabled}
                className={textareaClassName}
                value={field.value ?? ''}
              />
            </FormControl>
            <div className="flex items-center justify-between">
              {description ? (
                <FormDescription>{description}</FormDescription>
              ) : (
                <span />
              )}
              {showCount && maxLength && (
                <span
                  className={cn(
                    'text-muted-foreground text-xs',
                    charCount > maxLength * 0.9 && 'text-warning',
                    charCount >= maxLength && 'text-destructive',
                  )}
                >
                  {charCount}/{maxLength}
                </span>
              )}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// SelectField
// ---------------------------------------------------------------------------

export interface SelectFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  placeholder?: string;
  options: SelectOption[];
}

export function SelectField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  placeholder = 'Select...',
  options,
}: SelectFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ''}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// CheckboxField
// ---------------------------------------------------------------------------

export interface CheckboxFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {}

export function CheckboxField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  disabled,
}: CheckboxFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            'flex flex-row items-start space-x-3 space-y-0',
            className,
          )}
        >
          <FormControl>
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {label && <FormLabel className="cursor-pointer">{label}</FormLabel>}
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// SwitchField
// ---------------------------------------------------------------------------

export interface SwitchFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {}

export function SwitchField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  disabled,
}: SwitchFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            'flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm',
            className,
          )}
        >
          <div className="space-y-0.5">
            {label && <FormLabel>{label}</FormLabel>}
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// RadioGroupField
// ---------------------------------------------------------------------------

export interface RadioGroupFieldProps<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> extends BaseFieldProps<TValues, TName> {
  options: SelectOption[];
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical';
}

export function RadioGroupField<
  TValues extends FieldValues = FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  description,
  control: controlProp,
  className,
  required,
  disabled,
  options,
  orientation = 'vertical',
}: RadioGroupFieldProps<TValues, TName>) {
  const { control: contextControl } = useFormContext<TValues>();
  const control = controlProp ?? contextControl;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-3', className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value ?? ''}
              disabled={disabled}
              className={cn(
                orientation === 'horizontal'
                  ? 'flex flex-wrap gap-4'
                  : 'space-y-2',
              )}
            >
              {options.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${name}-${opt.value}`}
                    disabled={opt.disabled}
                  />
                  <Label
                    htmlFor={`${name}-${opt.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
