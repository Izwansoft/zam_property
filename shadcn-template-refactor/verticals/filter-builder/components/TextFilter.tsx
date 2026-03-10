// verticals/filter-builder/components/TextFilter.tsx — Text/search filter

"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterableField } from "../../types";

interface TextFilterProps {
  field: FilterableField;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function TextFilter({
  field,
  value,
  onChange,
  disabled,
}: TextFilterProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{field.label}</label>
      <div className="relative">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={`Search ${field.label.toLowerCase()}...`}
          disabled={disabled}
          className="pl-8 pr-8"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => onChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
