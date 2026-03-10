/**
 * Listing Attributes Component
 *
 * Displays vertical-specific attributes (e.g., bedrooms, sqft, furnishing).
 * Field keys match the vertical schema (verticals/real-estate/schema.ts).
 */

import {
  BedDouble,
  Bath,
  Maximize,
  Sofa,
  Car,
  Layers,
  Building2,
  Compass,
  Calendar,
  LandPlot,
  FileText,
  Users,
  Banknote,
  HardHat,
  FolderOpen,
  KeyRound,
  CalendarClock,
} from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";

interface ListingAttributesProps {
  listing: PublicListingDetail;
}

// Attribute display config — keys match verticals/real-estate/schema.ts
const ATTRIBUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bedrooms: BedDouble,
  bathrooms: Bath,
  builtUpSize: Maximize,
  landSize: LandPlot,
  furnishing: Sofa,
  carParks: Car,
  totalFloors: Layers,
  propertyType: Building2,
  facing: Compass,
  yearBuilt: Calendar,
  titleType: FileText,
  occupancy: Users,
  maintenanceFee: Banknote,
  developerName: HardHat,
  projectName: FolderOpen,
  rentalDeposit: KeyRound,
  minimumRentalPeriod: CalendarClock,
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  builtUpSize: "Built-up Size",
  landSize: "Land Size",
  furnishing: "Furnishing",
  carParks: "Car Parks",
  totalFloors: "Total Floors",
  floorLevel: "Floor Level",
  propertyType: "Property Type",
  listingType: "Listing Type",
  facing: "Facing",
  tenure: "Tenure",
  yearBuilt: "Year Built",
  condition: "Condition",
  titleType: "Title Type",
  occupancy: "Occupancy",
  maintenanceFee: "Maintenance Fee",
  projectName: "Project Name",
  developerName: "Developer",
  minimumRentalPeriod: "Min. Rental Period",
  rentalDeposit: "Rental Deposit",
  referenceId: "Reference ID",
};

// Attributes to hide for rent listings (not relevant to Partners)
const HIDE_FOR_RENT = new Set([
  "tenure",
  "yearBuilt",
  "titleType",
  "listingType",
  "developerName",
]);

// Attributes to hide for sale listings (rental-specific)
const HIDE_FOR_SALE = new Set([
  "rentalDeposit",
  "minimumRentalPeriod",
  "listingType",
]);

export function ListingAttributes({ listing }: ListingAttributesProps) {
  const attributes = listing.attributes;
  if (!attributes || Object.keys(attributes).length === 0) return null;

  const isRent = attributes.listingType === "rent";
  const hiddenKeys = isRent ? HIDE_FOR_RENT : HIDE_FOR_SALE;

  // Split into key attributes (with icons) and other attributes
  const keyAttrs: Array<{
    key: string;
    label: string;
    value: string;
    Icon?: React.ComponentType<{ className?: string }>;
  }> = [];

  const otherAttrs: Array<{ key: string; label: string; value: string }> = [];

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === "") continue;
    if (hiddenKeys.has(key)) continue;

    const label = ATTRIBUTE_LABELS[key] || formatAttributeKey(key);
    const displayValue = formatAttributeValue(key, value);

    if (ATTRIBUTE_ICONS[key]) {
      keyAttrs.push({
        key,
        label,
        value: displayValue,
        Icon: ATTRIBUTE_ICONS[key],
      });
    } else {
      otherAttrs.push({ key, label, value: displayValue });
    }
  }

  if (keyAttrs.length === 0 && otherAttrs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="p-6 md:p-8">
        <h2 className="mb-6 text-lg font-semibold">
          {isRent ? "Rental Details" : "Property Details"}
        </h2>

        <div className="space-y-6">
          {/* Key Attributes with Icons */}
          {keyAttrs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {keyAttrs.map(({ key, label, value, Icon }) => (
                <div
                  key={key}
                  className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-md"
                >
                  {Icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-600 shadow-md">
                      <Icon className="h-4.5 w-4.5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Attributes */}
          {otherAttrs.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {otherAttrs.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-2.5"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatAttributeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatAttributeValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value
      .map((v: string) =>
        v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      )
      .join(", ");
  }
  if (typeof value === "number") {
    if (key === "builtUpSize" || key === "landSize") {
      return `${value.toLocaleString()} sq ft`;
    }
    if (key === "maintenanceFee") {
      return `RM${value.toLocaleString()}/month`;
    }
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return String(value);
}
