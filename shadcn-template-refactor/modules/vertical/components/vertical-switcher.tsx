// =============================================================================
// VerticalSwitcher — Dropdown to select active vertical filter
// =============================================================================
// Shows in the Partner portal sidebar. Allows filtering listings/vendors
// by vertical type. "All Verticals" = no filter.
// Validates the stored selection against the partner's enabled verticals.
// =============================================================================

"use client";

import { useEffect } from "react";
import { LayersIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVerticalContextStore } from "@/modules/vertical/store/vertical-context-store";
import { useEnabledPartnerVerticals } from "@/modules/vertical/hooks/use-partner-verticals";

export function VerticalSwitcher() {
  const { selectedVertical, setSelectedVertical, ensureValidVertical } =
    useVerticalContextStore();
  const { data: enabled } = useEnabledPartnerVerticals();

  const verticals = enabled ?? [];

  // E3: Validate stored vertical against partner's enabled verticals.
  // If the partner doesn't have the stored vertical, reset to "All".
  useEffect(() => {
    if (verticals.length > 0) {
      const availableTypes = verticals.map((v) => v.vertical.type);
      ensureValidVertical(availableTypes);
    }
  }, [verticals, ensureValidVertical]);

  // Don't show if there's 0 or 1 vertical — no switching needed
  if (verticals.length <= 1) return null;

  const selectedLabel = selectedVertical
    ? verticals.find((v) => v.vertical.type === selectedVertical)?.vertical
        ?.name ?? selectedVertical
    : "All Verticals";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2 text-xs group-data-[collapsible=icon]:hidden"
        >
          <span className="flex items-center gap-2 truncate">
            <LayersIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {selectedLabel}
          </span>
          <ChevronsUpDownIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem
          onClick={() => setSelectedVertical(null)}
          className="gap-2"
        >
          <CheckIcon
            className={`h-3.5 w-3.5 ${
              !selectedVertical ? "opacity-100" : "opacity-0"
            }`}
          />
          <LayersIcon className="h-3.5 w-3.5 text-muted-foreground" />
          All Verticals
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {verticals.map((v) => {
          const label = v.vertical.name;
          const isSelected = selectedVertical === v.vertical.type;
          return (
            <DropdownMenuItem
              key={v.id}
              onClick={() => setSelectedVertical(v.vertical.type)}
              className="gap-2"
            >
              <CheckIcon
                className={`h-3.5 w-3.5 ${
                  isSelected ? "opacity-100" : "opacity-0"
                }`}
              />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
