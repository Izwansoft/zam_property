// verticals/real-estate/components/PropertyTypeSelector.tsx
// Visual grid selector for property types with icons

"use client";

import { useFormContext } from "react-hook-form";
import {
  Building2,
  Building,
  Home,
  Hotel,
  Castle,
  Store,
  Briefcase,
  Warehouse,
  Factory,
  Mountain,
  LayoutGrid,
  Landmark,
  Columns3,
  ArrowUpDown,
  Star,
  HelpCircle,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { PropertyType } from "../types";
import { PROPERTY_TYPE_LABELS } from "../constants";

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ElementType> = {
  apartment: Building2,
  condominium: Building,
  terrace: Home,
  semi_detached: Columns3,
  bungalow: Hotel,
  townhouse: Landmark,
  studio: LayoutGrid,
  penthouse: Star,
  duplex: ArrowUpDown,
  villa: Castle,
  shop_lot: Store,
  office: Briefcase,
  warehouse: Warehouse,
  factory: Factory,
  land: Mountain,
  other: HelpCircle,
};

interface PropertyTypeSelectorProps {
  /** Form field base path (e.g. "attributes") */
  basePath?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export function PropertyTypeSelector({
  basePath = "attributes",
  disabled,
}: PropertyTypeSelectorProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.propertyType`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Property Type <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(
                ([value, label]) => {
                  const Icon = PROPERTY_TYPE_ICONS[value];
                  const isSelected = field.value === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors",
                        "hover:border-primary/50 hover:bg-accent/50",
                        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
                        isSelected &&
                          "border-primary bg-primary/5 ring-primary/20 ring-1",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs leading-tight",
                          isSelected
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
