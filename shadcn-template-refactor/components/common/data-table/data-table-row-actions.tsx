// =============================================================================
// DataTableRowActions — Configurable 3-dot action menu for table rows
// =============================================================================
// Usage:
//   const actions: RowAction<User>[] = [
//     { label: "View", icon: Eye, onClick: (row) => router.push(`/users/${row.id}`) },
//     { label: "Edit", icon: Pencil, onClick: (row) => openEdit(row) },
//     { type: "separator" },
//     { label: "Delete", icon: Trash2, onClick: (row) => handleDelete(row), variant: "destructive" },
//   ];
//
//   // In column definition:
//   { id: "actions", cell: ({ row }) => <DataTableRowActions row={row} actions={actions} /> }
// =============================================================================

"use client";

import * as React from "react";
import { type Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single action item in the row actions dropdown */
export interface RowActionItem<TData> {
  type?: "item";
  /** Display label */
  label: string;
  /** Optional Lucide icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Click handler — receives the row's original data */
  onClick: (data: TData) => void;
  /** Visual variant — "destructive" shows red text */
  variant?: "default" | "destructive";
  /** Conditionally hide this action */
  hidden?: boolean | ((data: TData) => boolean);
  /** Conditionally disable this action */
  disabled?: boolean | ((data: TData) => boolean);
}

/** A separator between action groups */
export interface RowActionSeparator {
  type: "separator";
}

/** A label/header for a group of actions */
export interface RowActionLabel {
  type: "label";
  label: string;
}

/** Union type for all row action entries */
export type RowAction<TData> =
  | RowActionItem<TData>
  | RowActionSeparator
  | RowActionLabel;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DataTableRowActionsProps<TData> {
  /** TanStack Table Row instance */
  row: Row<TData>;
  /** Array of action items */
  actions: RowAction<TData>[];
  /** Optional menu label (default: "Actions") */
  menuLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveBoolean<TData>(
  value: boolean | ((data: TData) => boolean) | undefined,
  data: TData,
): boolean {
  if (typeof value === "function") return value(data);
  return value ?? false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTableRowActions<TData>({
  row,
  actions,
  menuLabel = "Actions",
}: DataTableRowActionsProps<TData>) {
  const data = row.original;

  // Filter out hidden actions
  const visibleActions = actions.filter((action) => {
    if (action.type === "separator" || action.type === "label") return true;
    return !resolveBoolean(action.hidden, data);
  });

  // Don't render the button if no actionable items are visible
  const hasItems = visibleActions.some(
    (a) => a.type !== "separator" && a.type !== "label",
  );
  if (!hasItems) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{menuLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {visibleActions.map((action, index) => {
          if (action.type === "separator") {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }

          if (action.type === "label") {
            return (
              <DropdownMenuLabel key={`label-${index}`}>
                {action.label}
              </DropdownMenuLabel>
            );
          }

          // Default: action item
          const isDisabled = resolveBoolean(action.disabled, data);

          return (
            <DropdownMenuItem
              key={action.label}
              disabled={isDisabled}
              className={
                action.variant === "destructive"
                  ? "text-destructive focus:text-destructive"
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(data);
              }}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
