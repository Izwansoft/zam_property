// =============================================================================
// TenancyActions — Action buttons based on tenancy status
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Wrench, 
  LogOut, 
  MoreVertical,
  Download,
  Calendar,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { TenancyStatus, type TenancyDetail } from "../types";
import { useRequestTermination } from "../hooks/useTenancyMutations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines which actions are available based on tenancy status
 */
function getAvailableActions(status: TenancyStatus): {
  canViewContract: boolean;
  canRequestTermination: boolean;
  canRequestMaintenance: boolean;
  canRequestInspection: boolean;
  canDownloadDocuments: boolean;
  canContactOwner: boolean;
} {
  const activeStatuses: TenancyStatus[] = [
    TenancyStatus.ACTIVE,
    TenancyStatus.OVERDUE,
  ];
  const contractStatuses: TenancyStatus[] = [
    TenancyStatus.PENDING_CONTRACT,
    TenancyStatus.PENDING_SIGNATURES,
    TenancyStatus.APPROVED,
    TenancyStatus.ACTIVE,
    TenancyStatus.OVERDUE,
    TenancyStatus.TERMINATION_REQUESTED,
    TenancyStatus.TERMINATING,
    TenancyStatus.TERMINATED,
  ];
  const terminableStatuses: TenancyStatus[] = [
    TenancyStatus.ACTIVE,
    TenancyStatus.OVERDUE,
  ];
  
  return {
    canViewContract: contractStatuses.includes(status),
    canRequestTermination: terminableStatuses.includes(status),
    canRequestMaintenance: activeStatuses.includes(status),
    canRequestInspection: activeStatuses.includes(status),
    canDownloadDocuments: contractStatuses.includes(status),
    canContactOwner: status !== TenancyStatus.TERMINATED && status !== TenancyStatus.CANCELLED,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenancyActionsProps {
  tenancy: TenancyDetail;
  /** Base path for navigation */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Termination Dialog
// ---------------------------------------------------------------------------

interface TerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
}

function TerminationDialog({ open, onOpenChange, tenancy }: TerminationDialogProps) {
  const [requestedDate, setRequestedDate] = useState("");
  const [reason, setReason] = useState("");
  
  const requestTermination = useRequestTermination();
  const isPending = requestTermination.isPending;
  
  // Calculate minimum date (notice period from today)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + (tenancy.noticePeriodDays || 30));
  const minDateStr = minDate.toISOString().split("T")[0];
  
  const handleSubmit = async () => {
    if (!requestedDate) {
      showError("Please select a move-out date");
      return;
    }
    
    try {
      await requestTermination.mutateAsync({
        tenancyId: tenancy.id,
        requestedDate,
        reason: reason || undefined,
      });
      
      showSuccess("Termination request submitted");
      onOpenChange(false);
      setRequestedDate("");
      setReason("");
    } catch (error) {
      showError("Failed to submit termination request");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Tenancy Termination</DialogTitle>
          <DialogDescription>
            Submit a termination request for this tenancy. 
            Notice period: {tenancy.noticePeriodDays || 30} days.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="moveOutDate">Requested Move-out Date</Label>
            <Input
              id="moveOutDate"
              type="date"
              min={minDateStr}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least {tenancy.noticePeriodDays || 30} days from today
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="E.g., relocating for work, buying own property..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !requestedDate}
          >
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TenancyActions
// ---------------------------------------------------------------------------

export function TenancyActions({ tenancy, basePath = "/dashboard/tenant/tenancy" }: TenancyActionsProps) {
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  
  const actions = getAvailableActions(tenancy.status);
  
  // Primary actions (shown as buttons)
  const primaryActions = [];
  
  if (actions.canViewContract && tenancy.contractId) {
    primaryActions.push(
      <Button key="contract" variant="outline" size="sm" asChild>
        <Link href={`${basePath}/${tenancy.id}/contract`}>
          <FileText className="mr-2 h-4 w-4" />
          View Contract
        </Link>
      </Button>
    );
  }
  
  if (actions.canRequestMaintenance) {
    primaryActions.push(
      <Button key="maintenance" variant="outline" size="sm" asChild>
        <Link href="/dashboard/tenant/maintenance/new">
          <Wrench className="mr-2 h-4 w-4" />
          Request Maintenance
        </Link>
      </Button>
    );
  }
  
  // Secondary actions (shown in dropdown)
  const hasSecondaryActions = 
    actions.canRequestTermination ||
    actions.canRequestInspection ||
    actions.canDownloadDocuments ||
    actions.canContactOwner;
  
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {primaryActions}
        
        {hasSecondaryActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.canRequestInspection && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/tenant/inspections/new">
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Inspection
                  </Link>
                </DropdownMenuItem>
              )}
              
              {actions.canDownloadDocuments && tenancy.contractUrl && (
                <DropdownMenuItem asChild>
                  <a href={tenancy.contractUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Contract
                  </a>
                </DropdownMenuItem>
              )}
              
              {actions.canContactOwner && tenancy.owner && (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${tenancy.owner.email}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Owner
                  </a>
                </DropdownMenuItem>
              )}
              
              {actions.canRequestTermination && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowTerminationDialog(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Request Termination
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <TerminationDialog
        open={showTerminationDialog}
        onOpenChange={setShowTerminationDialog}
        tenancy={tenancy}
      />
    </>
  );
}
