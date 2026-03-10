// verticals/attribute-renderer/fields/RangeField.tsx — Range (min/max) attribute field

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

interface RangeFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function RangeField({
  attribute,
  basePath,
  disabled,
}: RangeFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        const value = (field.value as { min?: number; max?: number }) ?? {};

        return (
          <FormItem>
            <FormLabel>
              {attribute.label}
              {attribute.requiredForPublish && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {attribute.ui.unit &&
                    attribute.ui.unitPosition === "prefix" && (
                      <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                        {attribute.ui.unit}
                      </span>
                    )}
                  <Input
                    type="number"
                    placeholder="Min"
                    value={value.min ?? ""}
                    onChange={(e) =>
                      field.onChange({
                        ...value,
                        min:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    disabled={disabled}
                    min={attribute.constraints.rangeBounds?.min}
                    max={attribute.constraints.rangeBounds?.max}
                    step={attribute.constraints.step ?? 1}
                    className={
                      attribute.ui.unit &&
                      attribute.ui.unitPosition === "prefix"
                        ? "pl-12"
                        : undefined
                    }
                  />
                </div>
                <span className="text-muted-foreground text-sm">to</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={value.max ?? ""}
                    onChange={(e) =>
                      field.onChange({
                        ...value,
                        max:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    disabled={disabled}
                    min={attribute.constraints.rangeBounds?.min}
                    max={attribute.constraints.rangeBounds?.max}
                    step={attribute.constraints.step ?? 1}
                  />
                  {attribute.ui.unit &&
                    attribute.ui.unitPosition !== "prefix" && (
                      <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                        {attribute.ui.unit}
                      </span>
                    )}
                </div>
              </div>
            </FormControl>
            {attribute.ui.helpText && (
              <FormDescription>{attribute.ui.helpText}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
