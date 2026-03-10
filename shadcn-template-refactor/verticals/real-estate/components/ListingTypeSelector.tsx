// verticals/real-estate/components/ListingTypeSelector.tsx
// Toggle-style selector for Sale / Rent

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
import { Tag, Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingTypeSelectorProps {
  basePath?: string;
  disabled?: boolean;
}

export function ListingTypeSelector({
  basePath = "attributes",
  disabled,
}: ListingTypeSelectorProps) {
  const form = useFormContext();
  const fieldName = `${basePath}.listingType`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Listing Type <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value ?? ""}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              disabled={disabled}
              className="justify-start"
            >
              <ToggleGroupItem
                value="sale"
                className={cn(
                  "flex items-center gap-2 px-6 py-2",
                  field.value === "sale" && "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                <Tag className="h-4 w-4" />
                For Sale
              </ToggleGroupItem>
              <ToggleGroupItem
                value="rent"
                className={cn(
                  "flex items-center gap-2 px-6 py-2",
                  field.value === "rent" && "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                <Key className="h-4 w-4" />
                For Rent
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
