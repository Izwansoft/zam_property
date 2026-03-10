// =============================================================================
// OwnerMaintenanceDetail — Owner's maintenance ticket detail view
// =============================================================================
// Extends the tenant MaintenanceDetail with owner-specific actions:
// - Verify, Assign, Start, Resolve, Close, Cancel
// - Shows tenant info, property info
// - Internal comments visible
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  UserPlus,
  Play,
  ClipboardCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { MaintenanceStatus } from "../types";
import type { Maintenance } from "../types";
import { MaintenanceDetail } from "./maintenance-detail";
import { MaintenanceAssignDialog } from "./maintenance-assign-dialog";
import {
  useVerifyMaintenance,
  useStartMaintenance,
  useResolveMaintenance,
  useCloseMaintenance,
  useCancelMaintenance,
} from "../hooks/useOwnerMaintenance";

// ---------------------------------------------------------------------------
// Status transition helpers
// ---------------------------------------------------------------------------

/** Actions available for each status */
function getAvailableActions(status: MaintenanceStatus): string[] {
  switch (status) {
    case MaintenanceStatus.OPEN:
      return ["verify", "cancel"];
    case MaintenanceStatus.VERIFIED:
      return ["assign", "cancel"];
    case MaintenanceStatus.ASSIGNED:
      return ["start", "cancel"];
    case MaintenanceStatus.IN_PROGRESS:
      return ["resolve"];
    case MaintenanceStatus.PENDING_APPROVAL:
      return ["close"];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerMaintenanceDetailProps {
  ticket: Maintenance;
  currentUserId?: string;
  backPath?: string;
  onActionComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OwnerMaintenanceDetail({
  ticket,
  currentUserId,
  backPath = "/dashboard/vendor/maintenance",
  onActionComplete,
}: OwnerMaintenanceDetailProps) {


  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Form states
  const [verificationNotes, setVerificationNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // Mutations
  const verifyMutation = useVerifyMaintenance(ticket.id);
  const startMutation = useStartMaintenance(ticket.id);
  const resolveMutation = useResolveMaintenance(ticket.id);
  const closeMutation = useCloseMaintenance(ticket.id);
  const cancelMutation = useCancelMaintenance(ticket.id);

  const availableActions = getAvailableActions(ticket.status);

  // ---------- Action handlers ----------

  const handleVerify = useCallback(async () => {
    try {
      await verifyMutation.mutateAsync({
        verificationNotes: verificationNotes || undefined,
      });
      showSuccess("Ticket verified", {
        description: `${ticket.ticketNumber} has been verified. You can now assign it.`,
      });
      setVerifyDialogOpen(false);
      setVerificationNotes("");
      onActionComplete?.();
    } catch {
      showError("Verification failed", {
        description: "Failed to verify the ticket. Please try again.",
      });
    }
  }, [verifyMutation, verificationNotes, ticket.ticketNumber, onActionComplete]);

  const handleStart = useCallback(async () => {
    try {
      await startMutation.mutateAsync({});
      showSuccess("Work started", {
        description: `${ticket.ticketNumber} is now in progress.`,
      });
      setStartConfirmOpen(false);
      onActionComplete?.();
    } catch {
      showError("Failed to start", {
        description: "Failed to start work on the ticket. Please try again.",
      });
    }
  }, [startMutation, ticket.ticketNumber, onActionComplete]);

  const handleResolve = useCallback(async () => {
    try {
      await resolveMutation.mutateAsync({
        resolution,
        actualCost: actualCost ? parseFloat(actualCost) : undefined,
      });
      showSuccess("Ticket resolved", {
        description: `${ticket.ticketNumber} marked as resolved, pending tenant approval.`,
      });
      setResolveDialogOpen(false);
      setResolution("");
      setActualCost("");
      onActionComplete?.();
    } catch {
      showError("Resolution failed", {
        description: "Failed to resolve the ticket. Please try again.",
      });
    }
  }, [resolveMutation, resolution, actualCost, ticket.ticketNumber, onActionComplete]);

  const handleClose = useCallback(async () => {
    try {
      await closeMutation.mutateAsync({});
      showSuccess("Ticket closed", {
        description: `${ticket.ticketNumber} has been closed.`,
      });
      setCloseConfirmOpen(false);
      onActionComplete?.();
    } catch {
      showError("Close failed", {
        description: "Failed to close the ticket. Please try again.",
      });
    }
  }, [closeMutation, ticket.ticketNumber, onActionComplete]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelMutation.mutateAsync({
        reason: cancelReason || undefined,
      });
      showSuccess("Ticket cancelled", {
        description: `${ticket.ticketNumber} has been cancelled.`,
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      onActionComplete?.();
    } catch {
      showError("Cancellation failed", {
        description: "Failed to cancel the ticket. Please try again.",
      });
    }
  }, [cancelMutation, cancelReason, ticket.ticketNumber, onActionComplete]);

  return (
    <div className="space-y-6">
      {/* Owner Action Bar */}
      {availableActions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Actions:
            </span>

            {availableActions.includes("verify") && (
              <Button
                size="sm"
                onClick={() => setVerifyDialogOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Verify Issue
              </Button>
            )}

            {availableActions.includes("assign") && (
              <Button
                size="sm"
                onClick={() => setAssignDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Assign
              </Button>
            )}

            {availableActions.includes("start") && (
              <Button
                size="sm"
                onClick={() => setStartConfirmOpen(true)}
              >
                <Play className="h-4 w-4 mr-1.5" />
                Start Work
              </Button>
            )}

            {availableActions.includes("resolve") && (
              <Button
                size="sm"
                onClick={() => setResolveDialogOpen(true)}
              >
                <ClipboardCheck className="h-4 w-4 mr-1.5" />
                Mark Resolved
              </Button>
            )}

            {availableActions.includes("close") && (
              <Button
                size="sm"
                onClick={() => setCloseConfirmOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Close Ticket
              </Button>
            )}

            {availableActions.includes("cancel") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tenant Info Card (owner sees partner details) */}
      {ticket.tenancy?.tenant && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reported By
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                {ticket.tenancy.tenant.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{ticket.tenancy.tenant.name}</p>
                {ticket.tenancy.tenant.email && (
                  <p className="text-sm text-muted-foreground">
                    {ticket.tenancy.tenant.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reuse the shared MaintenanceDetail component */}
      <MaintenanceDetail
        ticket={ticket}
        currentUserId={currentUserId}
        backPath={backPath}
      />

      {/* ---- Dialogs ---- */}

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Maintenance Issue</DialogTitle>
            <DialogDescription>
              Confirm that the reported issue ({ticket.ticketNumber}) is
              legitimate and needs attention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-notes">
                Verification Notes (Optional)
              </Label>
              <Textarea
                id="verification-notes"
                placeholder="Add any notes about the verification..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <MaintenanceAssignDialog
        ticket={ticket}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={onActionComplete}
      />

      {/* Start Work Confirmation */}
      <AlertDialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Work?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark ticket {ticket.ticketNumber} as &quot;In Progress&quot;. This
              indicates that repair work has begun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Starting..." : "Start Work"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Resolved</DialogTitle>
            <DialogDescription>
              Report that the work for {ticket.ticketNumber} has been completed.
              The tenant will be asked to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">
                Resolution Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolution"
                placeholder="Describe what was done to resolve the issue..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="actual-cost">Actual Cost (Optional)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  RM
                </span>
                <Input
                  id="actual-cost"
                  type="number"
                  placeholder="0.00"
                  className="pl-10"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolveMutation.isPending || !resolution.trim()}
            >
              {resolveMutation.isPending
                ? "Resolving..."
                : "Mark Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Close ticket {ticket.ticketNumber}. This confirms that the issue
              has been fully resolved and accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Closing..." : "Close Ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancel Maintenance Ticket
            </DialogTitle>
            <DialogDescription>
              Cancel ticket {ticket.ticketNumber}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="cancel-reason">Reason (Optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Why is this ticket being cancelled?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Open
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? "Cancelling..."
                : "Cancel Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerMaintenanceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action bar skeleton */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </CardContent>
      </Card>
      {/* Tenant info skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
