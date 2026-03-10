// verticals/attribute-renderer/fields/MultiSelectField.tsx â€” Multi-select attribute field

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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import type { AttributeDefinition } from "../../types";

interface MultiSelectFieldProps {
  attribute: AttributeDefinition;
  basePath: string;
  disabled?: boolean;
}

export function MultiSelectField({
  attribute,
  basePath,
  disabled,
}: MultiSelectFieldProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.${attribute.key}`;
  const options = attribute.constraints.options ?? [];

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        const toggleOption = (value: string) => {
          const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
          field.onChange(next);
        };

        return (
          <FormItem>
            <FormLabel>
              {attribute.label}
              {attribute.requiredForPublish && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="h-auto min-h-9 w-full justify-between font-normal"
                    disabled={disabled}
                  >
                    <div className="flex flex-wrap gap-1">
                      {selected.length === 0 && (
                        <span className="text-muted-foreground">
                          {attribute.ui.placeholder ||
                            `Select ${attribute.label}`}
                        </span>
                      )}
                      {selected.map((value) => {
                        const option = options.find((o) => o.value === value);
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="text-xs"
                          >
                            {option?.label ?? value}
                          </Badge>
                        );
                      })}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full min-w-50 p-2" align="start">
                <div className="max-h-60 space-y-1 overflow-auto">
                  {options
                    .filter((opt) => !opt.deprecated)
                    .map((option) => (
                      <label
                        key={option.value}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                      >
                        <Checkbox
                          checked={selected.includes(option.value)}
                          onCheckedChange={() => toggleOption(option.value)}
                          disabled={disabled}
                        />
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-muted-foreground ml-auto text-xs">
                            {option.description}
                          </span>
                        )}
                      </label>
                    ))}
                </div>
                {selected.length > 0 && (
                  <div className="border-t pt-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => field.onChange([])}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
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

