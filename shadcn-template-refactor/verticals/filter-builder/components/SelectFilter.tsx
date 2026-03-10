// verticals/filter-builder/components/SelectFilter.tsx — Select filter component

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterableField } from "../../types";

interface SelectFilterProps {
  field: FilterableField;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function SelectFilter({
  field,
  value,
  onChange,
  disabled,
}: SelectFilterProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{field.label}</label>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v === "__all__" ? undefined : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`All ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          {field.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
