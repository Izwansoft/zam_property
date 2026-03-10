// =============================================================================
// EditCompanyDialog — Edit company details (Admin)
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
import { useUpdateCompany } from "@/modules/company/hooks/useCompany";
import type { UpdateCompanyDto } from "@/modules/company/types";

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string | null;
  };
}

export function EditCompanyDialog({ open, onOpenChange, company }: EditCompanyDialogProps) {
  const updateCompany = useUpdateCompany(company.id);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateCompanyDto>({
    defaultValues: {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address ?? "",
      });
    }
  }, [open, company, reset]);

  const onSubmit = (data: UpdateCompanyDto) => {
    updateCompany.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>Update company registration details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" {...register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone</Label>
              <Input id="company-phone" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Address</Label>
            <Input id="company-address" {...register("address")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCompany.isPending || !isDirty}>
              {updateCompany.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
