// =============================================================================
// AuditLogFilters — Dynamic filter bar for audit log list
// =============================================================================
// Populates action-type and target-type dropdowns from backend.
// Supports date range, actor type, and text search.
// =============================================================================

"use client";

import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditActionTypes } from "../hooks/use-audit-action-types";
import { useAuditTargetTypes } from "../hooks/use-audit-target-types";
import type {
  AuditLogFilters as AuditLogFiltersType,
  AuditActorType,
} from "../types";
import {
  ACTOR_TYPE_LABELS,
  formatActionType,
  formatTargetType,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: AuditLogFiltersType) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_TYPES: AuditActorType[] = ["USER", "SYSTEM", "ADMIN", "ANONYMOUS"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogFiltersBar({
  filters,
  onFiltersChange,
}: AuditLogFiltersProps) {
  // Fetch dynamic filter options from backend (NOT hardcoded)
  const { data: actionTypesData } = useAuditActionTypes();
  const { data: targetTypesData } = useAuditTargetTypes();

  const actionTypes = (actionTypesData as unknown as { actionTypes: string[] })
    ?.actionTypes ?? [];
  const targetTypes = (targetTypesData as unknown as { targetTypes: string[] })
    ?.targetTypes ?? [];

  const handleChange = useCallback(
    (field: keyof AuditLogFiltersType, value: string | undefined) => {
      onFiltersChange({
        ...filters,
        [field]: value || undefined,
        page: 1, // Reset to first page on filter change
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
    });
  }, [filters.pageSize, onFiltersChange]);

  const hasActiveFilters =
    filters.actionType ||
    filters.targetType ||
    filters.actorType ||
    filters.targetId ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Action Type Filter */}
        <Select
          value={filters.actionType ?? "all"}
          onValueChange={(v) =>
            handleChange("actionType", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-50">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatActionType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Target Type Filter */}
        <Select
          value={filters.targetType ?? "all"}
          onValueChange={(v) =>
            handleChange("targetType", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Target Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Targets</SelectItem>
            {targetTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatTargetType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actor Type Filter */}
        <Select
          value={filters.actorType ?? "all"}
          onValueChange={(v) =>
            handleChange(
              "actorType",
              v === "all" ? undefined : v
            )
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Actor Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            {ACTOR_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {ACTOR_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Target ID Search */}
        <div className="relative w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Target ID..."
            value={filters.targetId ?? ""}
            onChange={(e) => handleChange("targetId", e.target.value || undefined)}
            className="pl-8"
          />
        </div>

        {/* Date Range */}
        <Input
          type="date"
          placeholder="Start Date"
          value={filters.startDate ?? ""}
          onChange={(e) =>
            handleChange("startDate", e.target.value || undefined)
          }
          className="w-[150px]"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          placeholder="End Date"
          value={filters.endDate ?? ""}
          onChange={(e) =>
            handleChange("endDate", e.target.value || undefined)
          }
          className="w-[150px]"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

