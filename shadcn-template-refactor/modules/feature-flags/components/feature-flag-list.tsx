// =============================================================================
// FeatureFlagList — Data table of all feature flags with toggle switches
// =============================================================================

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusIcon,
  EyeIcon,
  AlertTriangleIcon,
  ArchiveIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

import { useFeatureFlags } from "../hooks/use-feature-flags";
import { useUpdateFeatureFlag } from "../hooks/use-update-feature-flag";
import type { FeatureFlag, FeatureFlagType } from "../types";
import { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS } from "../types";
import { FeatureFlagCreateDialog } from "./feature-flag-create-dialog";

// ---------------------------------------------------------------------------
// Faceted Filters (static, outside component)
// ---------------------------------------------------------------------------

const flagTypeFacetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "type",
    title: "Type",
    options: [
      { label: "Boolean", value: "BOOLEAN" },
      { label: "Percentage Rollout", value: "PERCENTAGE" },
    ],
  },
  {
    columnId: "flagStatus",
    title: "Status",
    options: [
      { label: "Enabled", value: "enabled" },
      { label: "Disabled", value: "disabled" },
      { label: "Archived", value: "archived" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeatureFlagList() {
  const router = useRouter();
  const { data: flags, isLoading, error } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();
  const items = React.useMemo(() => (flags ?? []) as FeatureFlag[], [flags]);

  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  // Confirmation dialog state
  const [confirmToggle, setConfirmToggle] = React.useState<{
    flag: FeatureFlag;
    newValue: boolean;
  } | null>(null);

  const handleToggle = React.useCallback(
    (flag: FeatureFlag, newValue: boolean) => {
      setConfirmToggle({ flag, newValue });
    },
    []
  );

  const confirmToggleAction = () => {
    if (!confirmToggle) return;
    updateFlag.mutate(
      {
        key: confirmToggle.flag.key,
        defaultValue: confirmToggle.newValue,
      },
      {
        onSettled: () => setConfirmToggle(null),
      }
    );
  };

  // Columns need access to handleToggle, updateFlag state, and confirmToggle
  const columns = React.useMemo<ColumnDef<FeatureFlag, unknown>[]>(
    () => [
      {
        id: "flagStatus",
        accessorFn: (flag) =>
          flag.isArchived
            ? "archived"
            : flag.defaultValue
              ? "enabled"
              : "disabled",
        header: () => null,
        cell: () => null,
        enableHiding: true,
        enableSorting: false,
      },
      {
        accessorKey: "defaultValue",
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const flag = row.original;
          const isEmergencyKillSwitch =
            flag.key.includes("kill-switch") ||
            flag.key.includes("emergency");

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      checked={flag.defaultValue}
                      onCheckedChange={(checked) =>
                        handleToggle(flag, checked)
                      }
                      disabled={
                        (updateFlag.isPending &&
                          confirmToggle?.flag.key === flag.key) ||
                        flag.isArchived
                      }
                      className={
                        isEmergencyKillSwitch
                          ? "data-[state=checked]:bg-red-600"
                          : ""
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {flag.isArchived
                    ? "Archived flag — cannot toggle"
                    : flag.defaultValue
                      ? "Click to disable"
                      : "Click to enable"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "key",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Key" />
        ),
        cell: ({ row }) => {
          const flag = row.original;
          const isEmergencyKillSwitch =
            flag.key.includes("kill-switch") ||
            flag.key.includes("emergency");

          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/platform/feature-flags/${flag.key}`}
                className="font-mono text-sm text-primary hover:underline"
              >
                {flag.key}
              </Link>
              {isEmergencyKillSwitch && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangleIcon className="mr-1 h-3 w-3" />
                  Kill Switch
                </Badge>
              )}
              {flag.isArchived && (
                <Badge variant="secondary" className="text-xs">
                  <ArchiveIcon className="mr-1 h-3 w-3" />
                  Archived
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => (
          <span className="max-w-75 truncate block text-muted-foreground">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const flag = row.original;
          return (
            <Badge
              variant="outline"
              className={FLAG_TYPE_COLORS[flag.type as FeatureFlagType]}
            >
              {FLAG_TYPE_LABELS[flag.type as FeatureFlagType] ?? flag.type}
              {flag.type === "PERCENTAGE" &&
                flag.rolloutPercentage != null &&
                ` (${flag.rolloutPercentage}%)`}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "owner",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Owner" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.owner}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Modified" />
        ),
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(row.original.updatedAt), {
                  addSuffix: true,
                })}
              </TooltipTrigger>
              <TooltipContent>
                {format(new Date(row.original.updatedAt), "PPpp")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
    ],
    [handleToggle, updateFlag.isPending, confirmToggle]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center">
        <p className="text-destructive">
          Failed to load feature flags: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search flags..."
        searchColumnId="key"
        facetedFilters={flagTypeFacetedFilters}
        pageSize={20}
        emptyMessage="No feature flags found."
        onRowClick={(flag) => router.push(`/dashboard/platform/feature-flags/${flag.key}`)}
        rowActions={(flag) => [
          {
            type: "item",
            label: "View Details",
            icon: EyeIcon,
            onClick: () => router.push(`/dashboard/platform/feature-flags/${flag.key}`),
          },
        ]}
        toolbarActions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Flag
          </Button>
        }
      />

      {/* Confirm Toggle Dialog */}
      <AlertDialog
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.newValue ? "Enable" : "Disable"} Feature Flag?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to{" "}
              <strong>
                {confirmToggle?.newValue ? "enable" : "disable"}
              </strong>{" "}
              the flag{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                {confirmToggle?.flag.key}
              </code>
              . This change will be audited and take effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleAction}
              className={
                confirmToggle?.newValue
                  ? ""
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {updateFlag.isPending
                ? "Updating..."
                : confirmToggle?.newValue
                  ? "Enable"
                  : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <FeatureFlagCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
