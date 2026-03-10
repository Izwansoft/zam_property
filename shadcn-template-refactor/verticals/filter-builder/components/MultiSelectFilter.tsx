// verticals/filter-builder/components/MultiSelectFilter.tsx — Multi-select filter

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FilterableField } from "../../types";

interface MultiSelectFilterProps {
  field: FilterableField;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function MultiSelectFilter({
  field,
  value,
  onChange,
  disabled,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(value.length > 0);
  const options = field.options ?? [];

  const toggleOption = (optionValue: string) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1.5">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-auto w-full items-center justify-between p-0 hover:bg-transparent"
          >
            <span className="text-sm font-medium">
              {field.label}
              {value.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {value.length}
                </Badge>
              )}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1 pt-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                  disabled={disabled}
                />
                <span className="flex-1">{option.label}</span>
              </label>
            ))}
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => onChange([])}
              >
                Clear
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
