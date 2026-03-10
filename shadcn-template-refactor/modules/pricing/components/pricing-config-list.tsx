// =============================================================================
// PricingConfigList — DataTable with CRUD actions
// =============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
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
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { format } from "date-fns";
import { usePricingConfigs } from "../hooks/use-pricing-configs";
import { useDeletePricingConfig } from "../hooks/use-delete-pricing-config";
import { PricingConfigFormDialog } from "./pricing-config-form";
import type { PricingConfig } from "../types";
import {
  CHARGE_TYPE_LABELS,
  CHARGE_TYPE_COLORS,
  CHARGE_TYPES,
  PRICING_MODEL_LABELS,
  PRICING_MODEL_COLORS,
  PRICING_MODELS,
  formatAmount,
} from "../types";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<PricingConfig, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/platform/pricing/configs/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "chargeType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Charge Type" />
    ),
    cell: ({ row }) => {
      const ct = row.original.chargeType;
      return (
        <Badge variant="secondary" className={CHARGE_TYPE_COLORS[ct]}>
          {CHARGE_TYPE_LABELS[ct]}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "pricingModel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pricing Model" />
    ),
    cell: ({ row }) => {
      const pm = row.original.pricingModel;
      return (
        <Badge variant="outline" className={PRICING_MODEL_COLORS[pm]}>
          {PRICING_MODEL_LABELS[pm]}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "currency",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Currency" />
    ),
  },
  {
    accessorKey: "baseAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base Amount" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono">
        {formatAmount(row.original.baseAmount, row.original.currency)}
      </span>
    ),
  },
  {
    id: "configStatus",
    accessorFn: (config: PricingConfig) =>
      config.isActive ? "Active" : "Inactive",
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
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "chargeType",
    title: "Charge Type",
    options: CHARGE_TYPES.map((ct) => ({
      label: CHARGE_TYPE_LABELS[ct],
      value: ct,
    })),
  },
  {
    columnId: "pricingModel",
    title: "Pricing Model",
    options: PRICING_MODELS.map((pm) => ({
      label: PRICING_MODEL_LABELS[pm],
      value: pm,
    })),
  },
  {
    columnId: "configStatus",
    title: "Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
];

// ---------------------------------------------------------------------------
// PricingConfigList
// ---------------------------------------------------------------------------

export function PricingConfigList() {
  const { data, isLoading, error } = usePricingConfigs({ page: 1, pageSize: 100 });
  const items = React.useMemo(
    () => (data?.items ?? []) as PricingConfig[],
    [data?.items],
  );
  const deleteMutation = useDeletePricingConfig();

  const [editConfig, setEditConfig] = React.useState<PricingConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PricingConfig | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const handleCreate = React.useCallback(() => {
    setEditConfig(null);
    setFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load pricing configs. Please try again.
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchColumnId="name"
        searchPlaceholder="Search configs..."
        facetedFilters={facetedFilters}
        emptyMessage="No pricing configs found. Create one to get started."
        rowActions={(config) => [
          {
            type: "item",
            label: "Edit",
            icon: PencilIcon,
            onClick: () => {
              setEditConfig(config);
              setFormOpen(true);
            },
          },
          { type: "separator" },
          {
            type: "item",
            label: "Delete",
            icon: TrashIcon,
            variant: "destructive",
            onClick: () => setDeleteTarget(config),
          },
        ]}
        toolbarActions={
          <Button onClick={handleCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Config
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <PricingConfigFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={editConfig}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Config</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
              This action cannot be undone. Any associated pricing rules will
              also be affected.
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
