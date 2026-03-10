// verticals/real-estate/components/TenureSelector.tsx
// Tenure selection with Malaysian-specific options (Malay Reserve, Bumi Lot)

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
import { TENURE_LABELS } from "../constants";
import type { TenureType } from "../types";

interface TenureSelectorProps {
  basePath?: string;
  disabled?: boolean;
}

export function TenureSelector({
  basePath = "attributes",
  disabled,
}: TenureSelectorProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.tenure`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tenure</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tenure type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {(
                Object.entries(TENURE_LABELS) as [TenureType, string][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Property ownership type
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
