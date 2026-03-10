// verticals/attribute-renderer/fields/DateField.tsx — Date attribute field

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

interface DateFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function DateField({ attribute, basePath, disabled }: DateFieldProps) {
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
            <Input
              {...field}
              type="date"
              value={field.value ?? ""}
              disabled={disabled}
            />
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
