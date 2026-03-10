// verticals/attribute-renderer/fields/StringField.tsx — String/text attribute field

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
import { Textarea } from "@/components/ui/textarea";
import type { AttributeDefinition } from "../../types";

interface StringFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function StringField({
  attribute,
  basePath,
  disabled,
}: StringFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;
  const isLongText =
    attribute.ui.component === "textarea" ||
    (attribute.constraints.max && attribute.constraints.max > 200);

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
            {isLongText ? (
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={attribute.ui.placeholder}
                disabled={disabled}
                maxLength={attribute.constraints.max}
                rows={4}
              />
            ) : (
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder={attribute.ui.placeholder}
                disabled={disabled}
                maxLength={attribute.constraints.max}
              />
            )}
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
