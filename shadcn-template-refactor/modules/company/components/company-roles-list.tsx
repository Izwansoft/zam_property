// =============================================================================
// CompanyRolesList — Manage custom roles and permissions (RBAC)
// =============================================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Shield,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  useCompanyCustomRoles,
  useCreateCompanyCustomRole,
  useUpdateCompanyCustomRole,
  useDeleteCompanyCustomRole,
} from "../hooks/useCompanySettings";
import {
  COMPANY_PERMISSIONS,
  type CompanyCustomRole,
  type CreateCompanyCustomRoleDto,
} from "../types";

// ---------------------------------------------------------------------------
// Permission Groups
// ---------------------------------------------------------------------------

const PERMISSION_GROUPS: Record<string, string[]> = {
  Agents: [
    "agents.view",
    "agents.create",
    "agents.update",
    "agents.delete",
    "agents.assign",
  ],
  Listings: [
    "listings.view",
    "listings.create",
    "listings.update",
    "listings.delete",
  ],
  Commissions: [
    "commissions.view",
    "commissions.approve",
  ],
  Team: [
    "team.view",
    "team.manage",
  ],
  Reports: [
    "reports.view",
    "reports.export",
  ],
  Settings: [
    "settings.view",
    "settings.update",
  ],
  Documents: [
    "documents.view",
    "documents.upload",
    "documents.delete",
  ],
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CompanyRolesListProps {
  companyId: string;
}

export function CompanyRolesList({ companyId }: CompanyRolesListProps) {
  const { data: roles, isLoading } = useCompanyCustomRoles(companyId);
  const createRole = useCreateCompanyCustomRole(companyId);
  const updateRole = useUpdateCompanyCustomRole(companyId);
  const deleteRole = useDeleteCompanyCustomRole(companyId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CompanyCustomRole | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const openCreateDialog = () => {
    form.reset({
      name: "",
      description: "",
      permissions: [],
    });
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: CompanyCustomRole) => {
    form.reset({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions,
    });
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: RoleFormValues) => {
    if (editingRole) {
      await updateRole.mutateAsync({
        roleId: editingRole.id,
        name: values.name,
        description: values.description || undefined,
        permissions: values.permissions,
      });
    } else {
      const dto: CreateCompanyCustomRoleDto = {
        name: values.name,
        description: values.description || undefined,
        permissions: values.permissions,
      };
      await createRole.mutateAsync(dto);
    }
    setIsDialogOpen(false);
    setEditingRole(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (deleteRoleId) {
      await deleteRole.mutateAsync({ roleId: deleteRoleId });
      setDeleteRoleId(null);
    }
  };

  if (isLoading) {
    return <CompanyRolesListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Custom Roles</h3>
          <p className="text-sm text-muted-foreground">
            Define custom roles with specific permissions for your team.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {roles && roles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => openEditDialog(role)}
              onDelete={() => setDeleteRoleId(role.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No custom roles</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create custom roles to define granular permissions for team members.
          </p>
          <Button className="mt-4" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Role
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role name and permissions."
                : "Define a new custom role with specific permissions."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Agent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this role can do..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormDescription>
                      Select the permissions this role should have.
                    </FormDescription>
                    <div className="space-y-4 rounded-lg border p-4">
                      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                        <div key={group} className="space-y-2">
                          <p className="text-sm font-medium">{group}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {perms.map((perm) => {
                              const permLabel = COMPANY_PERMISSIONS[perm as keyof typeof COMPANY_PERMISSIONS];
                              return (
                                <div
                                  key={perm}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={perm}
                                    checked={field.value.includes(perm)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...field.value, perm]
                                        : field.value.filter((v) => v !== perm);
                                      field.onChange(newValue);
                                    }}
                                  />
                                  <label
                                    htmlFor={perm}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {permLabel ?? perm}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRole.isPending || updateRole.isPending}
                >
                  {(createRole.isPending || updateRole.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Users assigned to this
              role will lose their custom permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteRole.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Card
// ---------------------------------------------------------------------------

interface RoleCardProps {
  role: CompanyCustomRole;
  onEdit: () => void;
  onDelete: () => void;
}

function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{role.name}</CardTitle>
          {role.description && (
            <CardDescription>{role.description}</CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{role.permissions.length} permissions</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {role.permissions.slice(0, 5).map((perm) => {
              const permLabel = COMPANY_PERMISSIONS[perm as keyof typeof COMPANY_PERMISSIONS];
              return (
                <Badge key={perm} variant="secondary" className="text-xs">
                  {permLabel ?? perm}
                </Badge>
              );
            })}
            {role.permissions.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{role.permissions.length - 5} more
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Created {format(new Date(role.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CompanyRolesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-5 w-16" />
                ))}
              </div>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
