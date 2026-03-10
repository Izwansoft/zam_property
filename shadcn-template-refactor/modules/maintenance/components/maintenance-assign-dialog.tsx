// =============================================================================
// MaintenanceAssignDialog — Dialog for assigning maintenance tickets
// =============================================================================
// Allows owner to:
// - Assign to a staff member (from team)
// - OR assign to external contractor (name, phone)
// - Set estimated cost
// =============================================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Phone, DollarSign, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { Maintenance } from "../types";
import { useAssignMaintenance, type AssignMaintenanceDto } from "../hooks/useOwnerMaintenance";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const assignSchema = z.discriminatedUnion("assignType", [
  z.object({
    assignType: z.literal("staff"),
    assignedTo: z.string().min(1, "Please select a staff member"),
    contractorName: z.string().optional(),
    contractorPhone: z.string().optional(),
    estimatedCost: z.coerce.number().min(0).optional(),
  }),
  z.object({
    assignType: z.literal("contractor"),
    assignedTo: z.string().optional(),
    contractorName: z.string().min(2, "Contractor name is required"),
    contractorPhone: z.string().min(8, "Valid phone number is required"),
    estimatedCost: z.coerce.number().min(0).optional(),
  }),
]);

type AssignFormValues = z.infer<typeof assignSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceAssignDialogProps {
  ticket: Maintenance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceAssignDialog({
  ticket,
  open,
  onOpenChange,
  onSuccess,
}: MaintenanceAssignDialogProps) {

  const assignMutation = useAssignMaintenance(ticket.id);

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignType: "contractor",
      assignedTo: "",
      contractorName: "",
      contractorPhone: "",
      estimatedCost: undefined,
    },
  });

  const assignType = form.watch("assignType");

  const handleSubmit = async (values: AssignFormValues) => {
    try {
      const dto: AssignMaintenanceDto = {};

      if (values.assignType === "staff") {
        dto.assignedTo = values.assignedTo;
      } else {
        dto.contractorName = values.contractorName;
        dto.contractorPhone = values.contractorPhone;
      }

      if (values.estimatedCost) {
        dto.estimatedCost = values.estimatedCost;
      }

      await assignMutation.mutateAsync(dto);
      showSuccess("Ticket assigned", {
        description: `Maintenance ticket ${ticket.ticketNumber} has been assigned.`,
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch {
      showError("Assignment failed", {
        description: "Failed to assign the maintenance ticket. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Maintenance Ticket
          </DialogTitle>
          <DialogDescription>
            Assign ticket{" "}
            <span className="font-medium">{ticket.ticketNumber}</span> to a
            staff member or external contractor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* Assignment type selection */}
            <FormField
              control={form.control}
              name="assignType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staff" id="assign-staff" />
                        <Label htmlFor="assign-staff" className="cursor-pointer">
                          Staff Member
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="contractor"
                          id="assign-contractor"
                        />
                        <Label
                          htmlFor="assign-contractor"
                          className="cursor-pointer"
                        >
                          External Contractor
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Staff member field */}
            {assignType === "staff" && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter staff member name or ID"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Name or ID of the staff member to assign.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Contractor fields */}
            {assignType === "contractor" && (
              <>
                <FormField
                  control={form.control}
                  name="contractorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contractor Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="e.g. ABC Plumbing Services"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contractor Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="e.g. 012-345 6789"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Estimated cost */}
            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        RM
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Estimated repair cost in Malaysian Ringgit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
