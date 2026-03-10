"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, UserPlus } from "lucide-react";
import {
  usePropertyMembers,
  useRemovePropertyMember,
} from "../hooks/usePropertyMembers";
import type { PropertyMemberFilters } from "../types";
import { PropertyRoleBadge } from "./property-role-badge";

interface PropertyMemberListProps {
  listingId: string;
  canManage?: boolean;
  onAddMember?: () => void;
  className?: string;
}

/**
 * Table component that displays property team members.
 *
 * @example
 * ```tsx
 * <PropertyMemberList
 *   listingId="..."
 *   canManage={true}
 *   onAddMember={() => setDialogOpen(true)}
 * />
 * ```
 */
export function PropertyMemberList({
  listingId,
  canManage = false,
  onAddMember,
  className,
}: PropertyMemberListProps) {
  const [filters] = useState<PropertyMemberFilters>({ page: 1, limit: 20 });
  const { data, isLoading } = usePropertyMembers(listingId, filters);
  const removeMember = useRemovePropertyMember(listingId);

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    await removeMember.mutateAsync(memberId);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const members = data?.items ?? [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Property Team</h3>
        {canManage && onAddMember && (
          <Button size="sm" onClick={onAddMember}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No team members assigned to this property.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Notes</TableHead>
              {canManage && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user?.fullName ?? "—"}
                </TableCell>
                <TableCell>{member.user?.email ?? "—"}</TableCell>
                <TableCell>
                  <PropertyRoleBadge role={member.role} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.notes ?? "—"}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
