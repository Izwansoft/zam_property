// =============================================================================
// PricingConfigFiltersBar — Filter bar for pricing configs
// =============================================================================

"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";
import type { PricingConfigFilters } from "../types";
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
  DEFAULT_PRICING_CONFIG_FILTERS,
} from "../types";

interface PricingConfigFiltersBarProps {
  filters: PricingConfigFilters;
  onFiltersChange: (filters: PricingConfigFilters) => void;
}

export function PricingConfigFiltersBar({
  filters,
  onFiltersChange,
}: PricingConfigFiltersBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.chargeType ||
    filters.pricingModel ||
    filters.isActive !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-50 max-w-80">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              search: e.target.value || undefined,
              page: 1,
            })
          }
          className="pl-9"
        />
      </div>

      {/* Charge Type filter */}
      <Select
        value={filters.chargeType ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            chargeType: value === "all" ? undefined : (value as PricingConfigFilters["chargeType"]),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-45">
          <SelectValue placeholder="Charge Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Charge Types</SelectItem>
          {CHARGE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {CHARGE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Pricing Model filter */}
      <Select
        value={filters.pricingModel ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            pricingModel: value === "all" ? undefined : (value as PricingConfigFilters["pricingModel"]),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Pricing Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Models</SelectItem>
          {PRICING_MODELS.map((m) => (
            <SelectItem key={m} value={m}>
              {PRICING_MODEL_LABELS[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            isActive: value === "all" ? undefined : value === "active",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ ...DEFAULT_PRICING_CONFIG_FILTERS })}
        >
          <XIcon className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}


