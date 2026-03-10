// =============================================================================
// Platform Team — Super Admin Users & Roles management
// =============================================================================
// Lists all SUPER_ADMIN users. Allows inviting new platform team members.
// Backend: GET /api/v1/users?role=SUPER_ADMIN
// =============================================================================

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import {
  useAdminUsers,
  useAdminDeactivateUser,
  useAdminCreateUser,
} from "@/modules/admin/hooks/admin-users";
import { formatRelativeDate } from "@/modules/listing";
import { Eye, KeyRoundIcon, Pencil, PlusIcon, ShieldIcon, Trash2, UserIcon } from "lucide-react";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

// ---------------------------------------------------------------------------
// Invite Dialog
// ---------------------------------------------------------------------------

function generateTemporaryPassword(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `Temp!${random}9`;
}

function InviteTeamMemberDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState(generateTemporaryPassword());
  const createUser = useAdminCreateUser();

  const canSubmit = fullName.trim().length >= 2 && email.includes("@") && password.length >= 8;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await createUser.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      });

      showSuccess("Team member created", {
        description: `${fullName.trim()} can now sign in with the temporary password.`,
      });

      setFullName("");
      setEmail("");
      setPassword(generateTemporaryPassword());
      setOpen(false);
      onCreated?.();
    } catch {
      showError("Failed to create team member", {
        description: "Please verify the details and try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Platform Team Member</DialogTitle>
          <DialogDescription>
            Create a new Super Admin user. They will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Admin"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@lamaniaga.local"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Share this password securely and ask the user to rotate it after first login.
            </p>
          </div>
          <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 shrink-0" />
              <span>
                This user will be created with <strong>SUPER_ADMIN</strong> role
                and full platform access.
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createUser.isPending}>
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<TeamMember, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ShieldIcon className="h-3.5 w-3.5 text-destructive" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
    filterFn: (row, _id, value) => {
      const member = row.original;
      const searchLower = String(value).toLowerCase();
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("email")}
      </span>
    ),
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
      <DataTableColumnHeader column={column} title="Added" />
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

const statusFilterOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
];

const facetedFilters: FacetedFilterConfig[] = [
  { columnId: "status", title: "Status", options: statusFilterOptions },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformTeamContent() {
  const router = useRouter();
  const { data, isLoading, error } = useAdminUsers({
    page: 1,
    pageSize: 100,
    role: "SUPER_ADMIN",
  });
  const deactivateUser = useAdminDeactivateUser();

  const handleCreated = React.useCallback(() => {
    void router.refresh();
  }, [router]);

  const members = React.useMemo(
    () => (data?.items ?? []) as TeamMember[],
    [data?.items],
  );

  const activeCount = React.useMemo(
    () => members.filter((m) => m.status === "ACTIVE").length,
    [members],
  );

  const inactiveCount = React.useMemo(
    () => members.filter((m) => m.status !== "ACTIVE").length,
    [members],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Team"
        description="Manage Super Admin users who have full platform access."
        actions={[
          {
            label: "Invite Member",
            onClick: () => router.push("/dashboard/platform/users/create"),
            icon: PlusIcon,
          },
        ]}
      />

      {/* Role summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-destructive/10 p-2">
                <ShieldIcon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "—" : members.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-green-500/10 p-2">
                <UserIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "—" : activeCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "—" : inactiveCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2">
                <KeyRoundIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RBAC Scope</p>
                <p className="text-sm font-semibold">Full platform control</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
          <CardDescription>
            All users with Super Admin privileges on this platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load team members. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={members}
              isLoading={isLoading}
              searchPlaceholder="Search team members..."
              searchColumnId="name"
              facetedFilters={facetedFilters}
              pageSize={20}
              emptyMessage="No team members found."
              rowActions={(member) => [
                {
                  label: "View details",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/users/${member.id}`),
                },
                {
                  label: "Edit member",
                  icon: Pencil,
                  onClick: () => router.push(`/dashboard/platform/users/${member.id}`),
                },
                { type: "separator" as const },
                {
                  label: "Remove from team",
                  icon: Trash2,
                  onClick: async () => {
                    try {
                      await deactivateUser.mutateAsync(member.id);
                      showSuccess("Team member removed", {
                        description: "User has been deactivated.",
                      });
                    } catch {
                      showError("Failed to remove member", {
                        description: "Please try again.",
                      });
                    }
                  },
                  variant: "destructive" as const,
                },
              ]}
              onRowClick={(member) => router.push(`/dashboard/platform/users/${member.id}`)}
              toolbarActions={<InviteTeamMemberDialog onCreated={handleCreated} />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
