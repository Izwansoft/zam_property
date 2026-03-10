// =============================================================================
// EditVendorDialog — Edit vendor details (Admin)
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { useUpdateVendor, type UpdateVendorDto } from "@/modules/vendor/hooks/use-vendor-mutations";

interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    description?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    } | null;
  };
}

export function EditVendorDialog({ open, onOpenChange, vendor }: EditVendorDialogProps) {
  const updateVendor = useUpdateVendor();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateVendorDto>({
    defaultValues: {
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone ?? "",
      description: vendor.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone ?? "",
        description: vendor.description ?? "",
      });
    }
  }, [open, vendor, reset]);

  const onSubmit = (data: UpdateVendorDto) => {
    updateVendor.mutate(
      { ...data, id: vendor.id },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>Update vendor business information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">Business Name</Label>
            <Input id="vendor-name" {...register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input id="vendor-email" type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-description">Description</Label>
            <Textarea id="vendor-description" rows={3} {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateVendor.isPending || !isDirty}>
              {updateVendor.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
