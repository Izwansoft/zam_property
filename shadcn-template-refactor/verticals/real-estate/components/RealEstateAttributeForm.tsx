// verticals/real-estate/components/RealEstateAttributeForm.tsx
// Complete attribute form with conditional field visibility,
// grouped sections, and draft/publish mode support.

"use client";

import { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { PropertyTypeSelector } from "./PropertyTypeSelector";
import { ListingTypeSelector } from "./ListingTypeSelector";
import { TenureSelector } from "./TenureSelector";
import { FurnishingSelector } from "./FurnishingSelector";

import type { PropertyType, ListingType, RealEstateAttributes } from "../types";
import {
  RESIDENTIAL_PROPERTY_TYPES,
  HIGHRISE_PROPERTY_TYPES,
  LAND_SIZE_PROPERTY_TYPES,
  BUILT_UP_SIZE_PROPERTY_TYPES,
  FACING_TYPES,
  CONDITION_TYPES,
  RENTAL_PERIOD_TYPES,
  TITLE_TYPES,
  OCCUPANCY_TYPES,
  FACILITY_OPTIONS,
  AMENITY_OPTIONS,
} from "../types";
import {
  FACING_LABELS,
  CONDITION_LABELS,
  RENTAL_PERIOD_LABELS,
  FACILITY_LABELS,
  AMENITY_LABELS,
  TITLE_TYPE_LABELS,
  OCCUPANCY_LABELS,
} from "../constants";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RealEstateAttributeFormProps {
  /** Base path in the form (e.g. "attributes") */
  basePath?: string;
  /** Whether the form is in publish mode (stricter validation hints) */
  isPublishing?: boolean;
  /** Whether all fields are disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RealEstateAttributeForm({
  basePath = "attributes",
  isPublishing = false,
  disabled,
}: RealEstateAttributeFormProps) {
  const form = useFormContext();

  const propertyType = form.watch(`${basePath}.propertyType`) as
    | PropertyType
    | undefined;
  const listingType = form.watch(`${basePath}.listingType`) as
    | ListingType
    | undefined;

  // --- Conditional visibility helpers ---

  const showSizeSection = useMemo(() => {
    if (!propertyType) return false;
    return (
      BUILT_UP_SIZE_PROPERTY_TYPES.includes(propertyType) ||
      LAND_SIZE_PROPERTY_TYPES.includes(propertyType)
    );
  }, [propertyType]);

  const showBuiltUpSize = useMemo(
    () => !!propertyType && BUILT_UP_SIZE_PROPERTY_TYPES.includes(propertyType),
    [propertyType]
  );

  const showLandSize = useMemo(
    () => !!propertyType && LAND_SIZE_PROPERTY_TYPES.includes(propertyType),
    [propertyType]
  );

  const showRooms = useMemo(
    () =>
      !!propertyType && RESIDENTIAL_PROPERTY_TYPES.includes(propertyType),
    [propertyType]
  );

  const showFloorLevel = useMemo(
    () => !!propertyType && HIGHRISE_PROPERTY_TYPES.includes(propertyType),
    [propertyType]
  );

  const showTotalFloors = useMemo(
    () =>
      !!propertyType &&
      (propertyType === "apartment" || propertyType === "condominium"),
    [propertyType]
  );

  const showTenure = useMemo(
    () => listingType === "sale",
    [listingType]
  );

  const showRentalSection = useMemo(
    () => listingType === "rent",
    [listingType]
  );

  const isLand = propertyType === "land";

  return (
    <div className="space-y-6">
      {/* â”€â”€ Basic Information â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>
            Select the property and listing type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PropertyTypeSelector basePath={basePath} disabled={disabled} />
          <ListingTypeSelector basePath={basePath} disabled={disabled} />
        </CardContent>
      </Card>

      {/* â”€â”€ Size & Dimensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showSizeSection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Size & Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showBuiltUpSize && (
              <NumberInput
                basePath={basePath}
                name="builtUpSize"
                label="Built-up Size"
                unit="sq ft"
                min={1}
                max={1_000_000}
                required={isPublishing && !isLand}
                disabled={disabled}
              />
            )}
            {showLandSize && (
              <NumberInput
                basePath={basePath}
                name="landSize"
                label="Land Size"
                unit="sq ft"
                min={1}
                max={10_000_000}
                required={isPublishing && isLand}
                disabled={disabled}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* â”€â”€ Rooms & Parking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showRooms && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rooms & Parking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberInput
              basePath={basePath}
              name="bedrooms"
              label="Bedrooms"
              min={0}
              max={20}
              step={1}
              required={isPublishing}
              disabled={disabled}
            />
            <NumberInput
              basePath={basePath}
              name="bathrooms"
              label="Bathrooms"
              min={0}
              max={20}
              step={1}
              required={isPublishing}
              disabled={disabled}
            />
            <NumberInput
              basePath={basePath}
              name="carParks"
              label="Car Parks"
              min={0}
              max={10}
              step={1}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* â”€â”€ Property Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {showTenure && (
            <TenureSelector basePath={basePath} disabled={disabled} />
          )}
          <FurnishingSelector basePath={basePath} disabled={disabled} />

          <EnumSelect
            basePath={basePath}
            name="condition"
            label="Property Condition"
            options={CONDITION_TYPES as unknown as readonly string[]}
            labels={CONDITION_LABELS}
            disabled={disabled}
          />

          {showFloorLevel && (
            <StringInput
              basePath={basePath}
              name="floorLevel"
              label="Floor Level"
              placeholder="e.g., 15, Ground, Penthouse"
              maxLength={20}
              disabled={disabled}
            />
          )}

          <NumberInput
            basePath={basePath}
            name="yearBuilt"
            label="Year Built"
            min={1900}
            max={new Date().getFullYear() + 5}
            placeholder="e.g., 2020"
            disabled={disabled}
          />

          <EnumSelect
            basePath={basePath}
            name="titleType"
            label="Title Type"
            options={TITLE_TYPES as unknown as readonly string[]}
            labels={TITLE_TYPE_LABELS}
            disabled={disabled}
          />

          <EnumSelect
            basePath={basePath}
            name="occupancy"
            label="Occupancy"
            options={OCCUPANCY_TYPES as unknown as readonly string[]}
            labels={OCCUPANCY_LABELS}
            disabled={disabled}
          />

          <NumberInput
            basePath={basePath}
            name="maintenanceFee"
            label="Maintenance Fee"
            unit="RM/month"
            min={0}
            max={100_000}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* â”€â”€ Additional Features (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CollapsibleSection
        title="Project & Developer"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StringInput
            basePath={basePath}
            name="projectName"
            label="Project Name"
            placeholder="e.g., The Astaka"
            maxLength={100}
            disabled={disabled}
          />
          <StringInput
            basePath={basePath}
            name="developerName"
            label="Developer"
            placeholder="e.g., SP Setia"
            maxLength={100}
            disabled={disabled}
          />
        </div>
      </CollapsibleSection>

      {/* â”€â”€ Additional Features (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CollapsibleSection
        title="Additional Features"
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EnumSelect
            basePath={basePath}
            name="facing"
            label="Facing"
            options={FACING_TYPES as unknown as readonly string[]}
            labels={FACING_LABELS}
            disabled={disabled}
          />
          {showTotalFloors && (
            <NumberInput
              basePath={basePath}
              name="totalFloors"
              label="Total Floors"
              min={1}
              max={200}
              disabled={disabled}
            />
          )}
        </div>
      </CollapsibleSection>

      {/* â”€â”€ Facilities (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CollapsibleSection title="Facilities" defaultOpen={false}>
        <CheckboxGroup
          basePath={basePath}
          name="facilities"
          options={FACILITY_OPTIONS as unknown as readonly string[]}
          labels={FACILITY_LABELS}
          disabled={disabled}
        />
      </CollapsibleSection>

      {/* â”€â”€ Nearby Amenities (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CollapsibleSection title="Nearby Amenities" defaultOpen={false}>
        <CheckboxGroup
          basePath={basePath}
          name="nearbyAmenities"
          options={AMENITY_OPTIONS as unknown as readonly string[]}
          labels={AMENITY_LABELS}
          disabled={disabled}
        />
      </CollapsibleSection>

      {/* â”€â”€ Rental Terms (conditional) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showRentalSection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rental Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EnumSelect
              basePath={basePath}
              name="minimumRentalPeriod"
              label="Minimum Rental Period"
              options={RENTAL_PERIOD_TYPES as unknown as readonly string[]}
              labels={RENTAL_PERIOD_LABELS}
              disabled={disabled}
            />
            <StringInput
              basePath={basePath}
              name="rentalDeposit"
              label="Rental Deposit"
              placeholder="e.g., 2+1"
              maxLength={50}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* â”€â”€ Reference (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <CollapsibleSection title="Reference" defaultOpen={false}>
        <StringInput
          basePath={basePath}
          name="referenceId"
          label="Reference ID"
          placeholder="Your internal reference number"
          maxLength={50}
          helpText="Your internal reference number"
          disabled={disabled}
        />
      </CollapsibleSection>
    </div>
  );
}

// ===========================================================================
// INTERNAL FIELD COMPONENTS
// ===========================================================================

// --- NumberInput ---

function NumberInput({
  basePath,
  name,
  label,
  unit,
  min,
  max,
  step = 1,
  required,
  placeholder,
  disabled,
}: {
  basePath: string;
  name: string;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const form = useFormContext();
  const fieldName = `${basePath}.${name}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type="number"
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? undefined : Number(val));
                }}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={unit ? "pr-16" : undefined}
              />
              {unit && (
                <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {unit}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// --- StringInput ---

function StringInput({
  basePath,
  name,
  label,
  placeholder,
  maxLength,
  helpText,
  required,
  disabled,
}: {
  basePath: string;
  name: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const form = useFormContext();
  const fieldName = `${basePath}.${name}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
            />
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// --- EnumSelect ---

function EnumSelect({
  basePath,
  name,
  label,
  options,
  labels,
  required,
  disabled,
}: {
  basePath: string;
  name: string;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
}) {
  const form = useFormContext();
  const fieldName = `${basePath}.${name}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((value) => (
                <SelectItem key={value} value={value}>
                  {labels[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// --- CheckboxGroup ---

function CheckboxGroup({
  basePath,
  name,
  options,
  labels,
  disabled,
}: {
  basePath: string;
  name: string;
  options: readonly string[];
  labels: Record<string, string>;
  disabled?: boolean;
}) {
  const form = useFormContext();
  const fieldName = `${basePath}.${name}`;

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        const currentValues: string[] = field.value ?? [];

        const handleToggle = useCallback(
          (value: string) => {
            const updated = currentValues.includes(value)
              ? currentValues.filter((v) => v !== value)
              : [...currentValues, value];
            field.onChange(updated);
          },
          [currentValues, field]
        );

        return (
          <FormItem>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {options.map((value) => {
                const checked = currentValues.includes(value);
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 transition-colors",
                      "hover:bg-accent/50",
                      checked && "border-primary bg-primary/5",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleToggle(value)}
                      disabled={disabled}
                    />
                    <span className="text-sm">{labels[value] ?? value}</span>
                  </label>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// --- CollapsibleSection ---

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{title}</CardTitle>
              <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform in-data-[state=open]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

