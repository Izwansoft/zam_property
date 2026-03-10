"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, ShieldBan } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  useAdminDeactivateUser,
  useAdminUsers,
} from "@/modules/admin/hooks/admin-users";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { formatRelativeDate } from "@/modules/listing";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

interface PartnerUserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

const roleFilterOptions = [
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
  { label: "Deactivated", value: "DEACTIVATED" },
];

const facetedFilters: FacetedFilterConfig[] = [
  { columnId: "role", title: "Role", options: roleFilterOptions },
  { columnId: "status", title: "Status", options: statusFilterOptions },
];

const exportColumns: Record<string, string> = {
  fullName: "Name",
  email: "Email",
  role: "Role",
  status: "Status",
  lastLoginAt: "Last Login",
  createdAt: "Created At",
};

const columns: ColumnDef<PartnerUserItem, unknown>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <Badge variant="outline">{ROLE_LABELS[role] ?? role}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline">{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: "lastLoginAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];

export function PartnerUsersContent() {
  const router = useRouter();
  const { user } = useAuth();
  const deactivateUser = useAdminDeactivateUser();
  const partnerScope = user?.partnerId ?? undefined;
  const { data, isLoading, error } = useAdminUsers(
    { page: 1, pageSize: 100 },
    { partnerScope },
  );

  const users = React.useMemo(
    () => (data?.items ?? []) as PartnerUserItem[],
    [data?.items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users and roles across your partner organization."
      />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
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
          exportFileName="partner-users"
          exportColumns={exportColumns}
          enablePrint
          pageSize={20}
          emptyMessage="No users found."
          rowActions={(tableUser) => [
            {
              label: "View details",
              icon: Eye,
              onClick: () => router.push(`/dashboard/partner/users/${tableUser.id}`),
            },
            {
              label: "Suspend user",
              icon: ShieldBan,
              onClick: async () => {
                try {
                  await deactivateUser.mutateAsync(tableUser.id);
                  showSuccess("User suspended", {
                    description: `${tableUser.fullName} has been deactivated.`,
                  });
                } catch {
                  showError("Failed to suspend user", {
                    description: "Please try again.",
                  });
                }
              },
              variant: "destructive" as const,
              hidden: tableUser.status === "SUSPENDED",
            },
          ]}
          onRowClick={(user) => router.push(`/dashboard/partner/users/${user.id}`)}
        />
      )}
    </div>
  );
}
