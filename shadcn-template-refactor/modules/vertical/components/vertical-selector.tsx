// =============================================================================
// VerticalSelector — Global vertical filter for multi-vertical partners
// =============================================================================
// Displays a selector for partner's enabled verticals. Selection is persisted
// in Zustand store and filters all related data (listings, vendors, etc.).
// =============================================================================

"use client";

import { useEffect } from "react";
import { Layers, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useVerticalContextStore } from "../store/vertical-context-store";
import { getVerticalDisplayName } from "../utils/display-names";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VerticalSelectorProps {
  /** List of enabled vertical types for this partner */
  enabledVerticals: string[];
  /** Optional className for the container */
  className?: string;
  /** Variant: 'dropdown' (default) or 'pills' for inline selection */
  variant?: "dropdown" | "pills";
  /** Show "All Verticals" option (default: true) */
  showAllOption?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (vertical: string | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerticalSelector({
  enabledVerticals,
  className,
  variant = "dropdown",
  showAllOption = true,
  onSelectionChange,
}: VerticalSelectorProps) {
  const { selectedVertical, setSelectedVertical, ensureValidVertical } =
    useVerticalContextStore();

  // Validate on mount and when enabled verticals change
  useEffect(() => {
    ensureValidVertical(enabledVerticals);
  }, [enabledVerticals, ensureValidVertical]);

  // Don't render if only one vertical (no need to select)
  if (!showAllOption && enabledVerticals.length <= 1) {
    return null;
  }

  const handleSelect = (vertical: string | null) => {
    setSelectedVertical(vertical);
    onSelectionChange?.(vertical);
  };

  const displayLabel = selectedVertical
    ? getVerticalDisplayName(selectedVertical)
    : "All Verticals";

  // Pills variant - inline buttons
  if (variant === "pills") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {showAllOption && (
          <Button
            variant={selectedVertical === null ? "default" : "outline"}
            size="sm"
            className="h-8 rounded-full"
            onClick={() => handleSelect(null)}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            All
          </Button>
        )}
        {enabledVerticals.map((v) => (
          <Button
            key={v}
            variant={selectedVertical === v ? "default" : "outline"}
            size="sm"
            className="h-8 rounded-full"
            onClick={() => handleSelect(v)}
          >
            {getVerticalDisplayName(v)}
          </Button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 gap-2", className)}
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>{displayLabel}</span>
          {selectedVertical && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Filter by Vertical
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showAllOption && (
          <DropdownMenuItem
            onClick={() => handleSelect(null)}
            className="gap-2"
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-sm border",
                selectedVertical === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {selectedVertical === null && <Check className="h-3 w-3" />}
            </div>
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>All Verticals</span>
          </DropdownMenuItem>
        )}
        {enabledVerticals.map((v) => (
          <DropdownMenuItem
            key={v}
            onClick={() => handleSelect(v)}
            className="gap-2"
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-sm border",
                selectedVertical === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {selectedVertical === v && <Check className="h-3 w-3" />}
            </div>
            <span>{getVerticalDisplayName(v)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Hook for consuming selected vertical in other components
// ---------------------------------------------------------------------------

export { useVerticalContextStore } from "../store/vertical-context-store";
