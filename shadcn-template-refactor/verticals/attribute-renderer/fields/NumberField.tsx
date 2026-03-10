// verticals/attribute-renderer/fields/NumberField.tsx — Numeric attribute field

"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AttributeDefinition } from "../../types";

interface NumberFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function NumberField({
  attribute,
  basePath,
  disabled,
}: NumberFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {attribute.label}
            {attribute.requiredForPublish && (
              <span className="text-destructive ml-1">*</span>
            )}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {attribute.ui.unit &&
                attribute.ui.unitPosition === "prefix" && (
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    {attribute.ui.unit}
                  </span>
                )}
              <Input
                {...field}
                type="number"
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? undefined : Number(val));
                }}
                placeholder={attribute.ui.placeholder}
                disabled={disabled}
                min={attribute.constraints.min}
                max={attribute.constraints.max}
                step={attribute.constraints.step ?? 1}
                className={
                  attribute.ui.unit
                    ? attribute.ui.unitPosition === "prefix"
                      ? "pl-12"
                      : "pr-16"
                    : undefined
                }
              />
              {attribute.ui.unit &&
                attribute.ui.unitPosition !== "prefix" && (
                  <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {attribute.ui.unit}
                  </span>
                )}
            </div>
          </FormControl>
          {attribute.ui.helpText && (
            <FormDescription>{attribute.ui.helpText}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
