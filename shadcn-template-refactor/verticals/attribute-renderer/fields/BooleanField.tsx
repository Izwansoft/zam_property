// verticals/attribute-renderer/fields/BooleanField.tsx — Boolean/switch attribute field

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
import { Switch } from "@/components/ui/switch";
import type { AttributeDefinition } from "../../types";

interface BooleanFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function BooleanField({
  attribute,
  basePath,
  disabled,
}: BooleanFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{attribute.label}</FormLabel>
            {attribute.ui.helpText && (
              <FormDescription>{attribute.ui.helpText}</FormDescription>
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
