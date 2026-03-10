// =============================================================================
// AgentRegistrationForm — Dialog form to register a new agent
// =============================================================================
// Uses React Hook Form + Zod. Fields: user email, full name, phone,
// REN number, REN expiry, optional referral.
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

import { useRegisterAgent } from "../hooks/useAgents";

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const registerAgentSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required")
    .uuid("Must be a valid user ID"),
  renNumber: z
    .string()
    .min(3, "REN number must be at least 3 characters")
    .max(50, "REN number must be at most 50 characters")
    .optional()
    .or(z.literal("")),
  renExpiry: z
    .string()
    .optional()
    .or(z.literal("")),
  referredBy: z
    .string()
    .uuid("Must be a valid referral ID")
    .optional()
    .or(z.literal("")),
});

type RegisterAgentFormValues = z.infer<typeof registerAgentSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentRegistrationFormProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentRegistrationForm({
  companyId,
  open,
  onOpenChange,
}: AgentRegistrationFormProps) {

  const registerAgent = useRegisterAgent();

  const form = useForm<RegisterAgentFormValues>({
    resolver: zodResolver(registerAgentSchema),
    defaultValues: {
      userId: "",
      renNumber: "",
      renExpiry: "",
      referredBy: "",
    },
  });

  const handleSubmit = async (values: RegisterAgentFormValues) => {
    try {
      await registerAgent.mutateAsync({
        companyId,
        userId: values.userId,
        renNumber: values.renNumber || undefined,
        renExpiry: values.renExpiry || undefined,
        referredBy: values.referredBy || undefined,
      });

      showSuccess("Agent registered", {
        description: "The agent has been successfully registered to your company.",
      });

      form.reset();
      onOpenChange(false);
    } catch {
      showError("Registration failed", {
        description: "Failed to register the agent. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Agent</DialogTitle>
          <DialogDescription>
            Add an agent to your company. The user must already have an account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* User ID */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user UUID" {...field} />
                  </FormControl>
                  <FormDescription>
                    The existing user account to register as an agent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* REN Number */}
            <FormField
              control={form.control}
              name="renNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>REN Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., REN 12345" {...field} />
                  </FormControl>
                  <FormDescription>
                    Real Estate Negotiator registration number (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* REN Expiry */}
            <FormField
              control={form.control}
              name="renExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>REN Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referred By */}
            <FormField
              control={form.control}
              name="referredBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referred By</FormLabel>
                  <FormControl>
                    <Input placeholder="Referral agent UUID (optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    UUID of the referring agent, if applicable.
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
                disabled={registerAgent.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registerAgent.isPending}>
                {registerAgent.isPending ? "Registering..." : "Register Agent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
