// =============================================================================
// PricingRulesList — DataTable with create/delete
// =============================================================================

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusIcon, TrashIcon } from "lucide-react";
import { usePricingRules } from "../hooks/use-pricing-rules";
import { useDeletePricingRule } from "../hooks/use-delete-pricing-rule";
import { PricingRuleFormDialog } from "./pricing-rule-form";
import type { PricingRule } from "../types";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<PricingRule, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rule Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "pricingConfig",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Config" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.pricingConfig?.name ?? row.original.pricingConfigId}
      </span>
    ),
  },
  {
    accessorKey: "condition",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Condition" />
    ),
    cell: ({ row }) => (
      <code className="text-xs bg-muted px-2 py-1 rounded">
        {JSON.stringify(row.original.condition)}
      </code>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "multiplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Multiplier" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono">
        ×{row.original.multiplier.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => (
      <span className="text-right">{row.original.priority}</span>
    ),
  },
  {
    id: "ruleStatus",
    accessorFn: (rule: PricingRule) =>
      rule.isActive ? "Active" : "Inactive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge variant={status === "Active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      value.includes(row.getValue(id)),
  },
];

// ---------------------------------------------------------------------------
// Faceted filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "ruleStatus",
    title: "Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PricingRulesListProps {
  /** Pre-filter by a specific pricing config ID */
  pricingConfigId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingRulesList({ pricingConfigId }: PricingRulesListProps) {
  const { data, isLoading, error } = usePricingRules({
    page: 1,
    pageSize: 100,
    pricingConfigId,
  });
  const items = React.useMemo(
    () => (data?.items ?? []) as PricingRule[],
    [data?.items],
  );
  const deleteMutation = useDeletePricingRule();

  const [deleteTarget, setDeleteTarget] = React.useState<PricingRule | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load pricing rules. Please try again.
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchColumnId="name"
        searchPlaceholder="Search rules..."
        facetedFilters={facetedFilters}
        emptyMessage="No pricing rules found. Add a rule to customize charge calculations."
        rowActions={(rule) => [
          {
            type: "item",
            label: "Delete",
            icon: TrashIcon,
            variant: "destructive",
            onClick: () => setDeleteTarget(rule),
          },
        ]}
        toolbarActions={
          <Button onClick={() => setFormOpen(true)} size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        }
      />

      {/* Create Rule Dialog */}
      <PricingRuleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultConfigId={pricingConfigId}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule &ldquo;{deleteTarget?.name}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
