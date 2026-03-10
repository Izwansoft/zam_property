"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertyRole } from "@/types/backend-contracts";
import { useAddPropertyMember } from "../hooks/usePropertyMembers";
import { PropertyRoleSelect } from "./property-role-select";

interface AddPropertyMemberDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for adding a new property team member.
 * Collects userId, role, and optional notes.
 *
 * @example
 * ```tsx
 * <AddPropertyMemberDialog
 *   listingId="..."
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 * />
 * ```
 */
export function AddPropertyMemberDialog({
  listingId,
  open,
  onOpenChange,
}: AddPropertyMemberDialogProps) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<PropertyRole | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const addMember = useAddPropertyMember(listingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !role) return;

    await addMember.mutateAsync({
      userId,
      role,
      notes: notes || undefined,
    });

    // Reset form and close
    setUserId("");
    setRole(undefined);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a user to this property with a specific role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Property Role</Label>
            <PropertyRoleSelect
              value={role}
              onValueChange={setRole}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handles leasing for units 1-10"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!userId || !role || addMember.isPending}
            >
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
