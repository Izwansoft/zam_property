// verticals/attribute-renderer/fields/SelectField.tsx — Enum/select attribute field

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttributeDefinition } from "../../types";

interface SelectFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function SelectField({
  attribute,
  basePath,
  disabled,
}: SelectFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;
  const options = attribute.constraints.options ?? [];

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
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    attribute.ui.placeholder || `Select ${attribute.label}`
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options
                .filter((opt) => !opt.deprecated)
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {attribute.ui.helpText && (
            <FormDescription>{attribute.ui.helpText}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
