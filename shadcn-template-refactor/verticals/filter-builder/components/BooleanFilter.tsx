// verticals/filter-builder/components/BooleanFilter.tsx — Boolean toggle filter

"use client";

import { Switch } from "@/components/ui/switch";
import type { FilterableField } from "../../types";

interface BooleanFilterProps {
  field: FilterableField;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  disabled?: boolean;
}

export function BooleanFilter({
  field,
  value,
  onChange,
  disabled,
}: BooleanFilterProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <label className="text-sm font-medium">{field.label}</label>
      <Switch
        checked={value ?? false}
        onCheckedChange={(checked) => onChange(checked || undefined)}
        disabled={disabled}
      />
    </div>
  );
}
