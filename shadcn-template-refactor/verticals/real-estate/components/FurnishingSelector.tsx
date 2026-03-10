// verticals/real-estate/components/FurnishingSelector.tsx
// Visual toggle-style furnishing selector

"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { FURNISHING_LABELS } from "../constants";
import type { FurnishingType } from "../types";

interface FurnishingSelectorProps {
  basePath?: string;
  disabled?: boolean;
}

export function FurnishingSelector({
  basePath = "attributes",
  disabled,
}: FurnishingSelectorProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.furnishing`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Furnishing</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value ?? ""}
              onValueChange={(value) => {
                // Allow deselection
                field.onChange(value || undefined);
              }}
              disabled={disabled}
              className="justify-start flex-wrap"
            >
              {(
                Object.entries(FURNISHING_LABELS) as [FurnishingType, string][]
              ).map(([value, label]) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className={cn(
                    "px-4 py-2",
                    field.value === value &&
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  )}
                >
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
