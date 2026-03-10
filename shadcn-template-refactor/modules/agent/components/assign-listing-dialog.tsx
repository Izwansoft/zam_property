// =============================================================================
// AssignListingDialog — Dialog to assign a listing to an agent
// =============================================================================

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { useAssignListing } from "../hooks/useAgents";

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const assignListingSchema = z.object({
  listingId: z
    .string()
    .min(1, "Listing ID is required")
    .uuid("Must be a valid listing ID"),
});

type AssignListingFormValues = z.infer<typeof assignListingSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssignListingDialogProps {
  agentId: string;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignListingDialog({
  agentId,
  agentName,
  open,
  onOpenChange,
}: AssignListingDialogProps) {

  const assignListing = useAssignListing();

  const form = useForm<AssignListingFormValues>({
    resolver: zodResolver(assignListingSchema),
    defaultValues: {
      listingId: "",
    },
  });

  const handleSubmit = async (values: AssignListingFormValues) => {
    try {
      await assignListing.mutateAsync({
        agentId,
        listingId: values.listingId,
      });

      showSuccess("Listing assigned", {
        description: `Listing has been assigned to ${agentName}.`,
      });

      form.reset();
      onOpenChange(false);
    } catch {
      showError("Assignment failed", {
        description: "Failed to assign the listing. It may already be assigned.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Listing</DialogTitle>
          <DialogDescription>
            Assign a listing to <strong>{agentName}</strong>. The agent will be
            responsible for managing inquiries for this listing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="listingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listing ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter listing UUID" {...field} />
                  </FormControl>
                  <FormDescription>
                    The UUID of the listing to assign to this agent.
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
                disabled={assignListing.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignListing.isPending}>
                {assignListing.isPending ? "Assigning..." : "Assign Listing"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
