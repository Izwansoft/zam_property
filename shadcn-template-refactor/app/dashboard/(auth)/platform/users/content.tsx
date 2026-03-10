// =============================================================================
// Platform Users — Client Content (All Users cross-partner)
// =============================================================================
// Cross-partner user list for Platform Admin (SUPER_ADMIN).
// Backend: GET /api/v1/users (SUPER_ADMIN has full cross-partner access)
// =============================================================================

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { useAdminUsers, useAdminDeactivateUser } from "@/modules/admin/hooks/admin-users";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { formatRelativeDate } from "@/modules/listing";
import { Eye, Pencil, PlusIcon, ShieldBan, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  partnerId?: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_BADGE_VARIANTS: Record<string, string> = {
  SUPER_ADMIN: "destructive",
  PARTNER_ADMIN: "default",
  VENDOR_ADMIN: "secondary",
  VENDOR_STAFF: "outline",
  CUSTOMER: "outline",
  TENANT: "outline",
  COMPANY_ADMIN: "secondary",
  AGENT: "outline",
  GUEST: "outline",
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
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className={cn("text-xs font-semibold", getAvatarFallbackClass(user.fullName))}>
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
// Faceted Filters
// ---------------------------------------------------------------------------

const roleFilterOptions = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Partner Admin", value: "PARTNER_ADMIN" },
  { label: "Vendor Admin", value: "VENDOR_ADMIN" },
  { label: "Vendor Staff", value: "VENDOR_STAFF" },
  { label: "Company Admin", value: "COMPANY_ADMIN" },
  { label: "Agent", value: "AGENT" },
  { label: "Customer", value: "CUSTOMER" },
  { label: "Tenant", value: "TENANT" },
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
// Export Columns
// ---------------------------------------------------------------------------

const exportColumns: Record<string, string> = {
  fullName: "Name",
  email: "Email",
  role: "Role",
  status: "Status",
  lastLoginAt: "Last Login",
  createdAt: "Created At",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformUsersContent() {
  const router = useRouter();
  const deactivateUser = useAdminDeactivateUser();
  const { data, isLoading, error } = useAdminUsers({ page: 1, pageSize: 100 });

  const users = React.useMemo(
    () => (data?.items ?? []) as UserItem[],
    [data?.items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Users"
        description="Cross-partner user directory. View all users across all partners and roles."
        actions={[
          {
            label: "Create User",
            icon: PlusIcon,
            onClick: () => router.push("/dashboard/platform/users/create"),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            All platform users across all partners and roles.
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
              exportFileName="platform-users"
              exportColumns={exportColumns}
              enablePrint
              pageSize={20}
              emptyMessage="No users found."
              rowActions={(user) => [
                {
                  label: "View details",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/users/${user.id}`),
                },
                {
                  label: "Edit user",
                  icon: Pencil,
                  onClick: () => router.push(`/dashboard/platform/users/${user.id}`),
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
              onRowClick={(user) => router.push(`/dashboard/platform/users/${user.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
