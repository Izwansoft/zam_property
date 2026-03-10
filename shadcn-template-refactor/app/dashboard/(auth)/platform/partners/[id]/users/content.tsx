// =============================================================================
// Partner Users Sub-page — Advanced data table with filters, export, print
// =============================================================================

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { useAdminUsers, useAdminDeactivateUser } from "@/modules/admin/hooks/admin-users";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { formatRelativeDate } from "@/modules/listing";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Eye, Pencil, ShieldBan, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const ROLE_BADGE_VARIANTS: Record<string, string> = {
  PARTNER_ADMIN: "default",
  VENDOR_ADMIN: "secondary",
  VENDOR_STAFF: "outline",
  CUSTOMER: "outline",
  TENANT: "outline",
  COMPANY_ADMIN: "secondary",
  AGENT: "outline",
};

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
  PENDING: "outline",
};

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<UserItem, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatar ?? undefined} alt={user.fullName} />
            <AvatarFallback className="text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      const user = row.original;
      const searchLower = String(value).toLowerCase();
      return (
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const variant = ROLE_BADGE_VARIANTS[role] ?? "outline";
      return <Badge variant={variant as "default"}>{ROLE_LABELS[role] ?? role}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = STATUS_BADGE_VARIANTS[status] ?? "outline";
      return <Badge variant={variant as "default"}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: "lastLoginAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Login" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("lastLoginAt") as string | null;
      return (
        <span className="text-xs text-muted-foreground">
          {val ? formatRelativeDate(val) : "Never"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];



// ---------------------------------------------------------------------------
// Faceted Filter Options
// ---------------------------------------------------------------------------

const roleFilterOptions = [
  { label: "Partner Admin", value: "PARTNER_ADMIN" },
  { label: "Vendor Admin", value: "VENDOR_ADMIN" },
  { label: "Vendor Staff", value: "VENDOR_STAFF" },
  { label: "Company Admin", value: "COMPANY_ADMIN" },
  { label: "Agent", value: "AGENT" },
  { label: "Customer", value: "CUSTOMER" },
];

const statusFilterOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending", value: "PENDING" },
];

const facetedFilters: FacetedFilterConfig[] = [
  { columnId: "role", title: "Role", options: roleFilterOptions },
  { columnId: "status", title: "Status", options: statusFilterOptions },
];

// ---------------------------------------------------------------------------
// Export columns mapping for CSV
// ---------------------------------------------------------------------------

const exportColumns: Record<string, string> = {
  fullName: "Full Name",
  email: "Email",
  role: "Role",
  status: "Status",
  lastLoginAt: "Last Login",
  createdAt: "Created At",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerUsersContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const partnerId = params.id;

  const { data: partner } = usePartnerDetail(partnerId);
  const deactivateUser = useAdminDeactivateUser();
  const { data, isLoading, error } = useAdminUsers(
    { page: 1, pageSize: 100 },
    { partnerScope: partnerId },
  );

  const users = React.useMemo(
    () => (data?.items ?? []) as UserItem[],
    [data?.items],
  );

  const roleGroups = React.useMemo(() => {
    return users.reduce<Record<string, number>>((acc, user) => {
      acc[user.role] = (acc[user.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const sortedRoleGroups = React.useMemo(
    () => Object.entries(roleGroups).sort(([, a], [, b]) => b - a),
    [roleGroups],
  );

  if (!partner) return null;

  return (
    <div className="space-y-6">
      <PartnerDetailHeader
        partner={partner}
        basePath="/dashboard/platform/partners"
      />

      <PartnerDetailTabs partnerId={partnerId} />

      {/* Compact role summary */}
      {!isLoading && users.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="h-7 px-3">
                Total: {users.length}
              </Badge>
              {sortedRoleGroups.map(([role, count]) => (
                <Badge key={role} variant="secondary" className="h-7 px-3">
                  {(ROLE_LABELS[role] ?? role).replace(/_/g, " ")}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partner Users</CardTitle>
          <CardDescription>
            All users belonging to this partner. Use filters to narrow by role or status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load users. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              isLoading={isLoading}
              enableRowSelection
              searchPlaceholder="Search users by name or email..."
              searchColumnId="fullName"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName={`partner-users-${partnerId.slice(0, 8)}`}
              exportColumns={exportColumns}
              enablePrint
              pageSize={25}
              emptyMessage="No users found for this partner."
              rowActions={(user) => [
                {
                  label: "View details",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/users/${user.id}`),
                },
                {
                  label: "Edit user",
                  icon: Pencil,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/users/${user.id}`),
                },
                { type: "separator" as const },
                {
                  label: "Suspend user",
                  icon: ShieldBan,
                  onClick: async () => {
                    try {
                      await deactivateUser.mutateAsync(user.id);
                      showSuccess("User suspended", {
                        description: `${user.fullName} has been deactivated.`,
                      });
                    } catch {
                      showError("Failed to suspend user", {
                        description: "Please try again.",
                      });
                    }
                  },
                  variant: "destructive" as const,
                  hidden: user.status === "SUSPENDED",
                },
                {
                  label: "Delete user",
                  icon: Trash2,
                  onClick: async () => {
                    try {
                      await deactivateUser.mutateAsync(user.id);
                      showSuccess("User deactivated", {
                        description: `${user.fullName} has been removed from active users.`,
                      });
                    } catch {
                      showError("Failed to delete user", {
                        description: "Please try again.",
                      });
                    }
                  },
                  variant: "destructive" as const,
                },
              ]}
              onRowClick={(user) => router.push(`/dashboard/platform/partners/${partnerId}/users/${user.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
