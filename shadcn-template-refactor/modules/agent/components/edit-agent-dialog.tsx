// =============================================================================
// EditAgentDialog — Edit agent details (Admin)
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
import { useUpdateAgent } from "@/modules/agent/hooks/useAgents";
import type { UpdateAgentDto } from "@/modules/agent/types";

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: {
    id: string;
    renNumber: string | null;
    renExpiry: string | null;
  };
}

export function EditAgentDialog({ open, onOpenChange, agent }: EditAgentDialogProps) {
  const updateAgent = useUpdateAgent();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateAgentDto>({
    defaultValues: {
      renNumber: agent.renNumber ?? "",
      renExpiry: agent.renExpiry?.split("T")[0] ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        renNumber: agent.renNumber ?? "",
        renExpiry: agent.renExpiry?.split("T")[0] ?? "",
      });
    }
  }, [open, agent, reset]);

  const onSubmit = (data: UpdateAgentDto) => {
    updateAgent.mutate(
      { ...data, id: agent.id },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Update agent registration details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-ren">REN Number</Label>
            <Input id="agent-ren" {...register("renNumber")} placeholder="e.g. REN 12345" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-ren-expiry">REN Expiry</Label>
            <Input id="agent-ren-expiry" type="date" {...register("renExpiry")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAgent.isPending || !isDirty}>
              {updateAgent.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
