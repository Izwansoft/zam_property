// =============================================================================
// OwnerTenancyActions — Owner action buttons based on tenancy status
// =============================================================================
// Context-aware actions for property owners/vendors managing tenancies.
// Actions include: approve/reject, confirm deposit, sign contract, handover,
// request inspection, process termination.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Wallet,
  FileSignature,
  ClipboardCheck,
  Search,
  LogOut,
  MoreVertical,
  Calendar,
  AlertTriangle,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { TenancyStatus, type TenancyDetail } from "../types";
import {
  useApproveTenancy,
  useRejectTenancy,
  useConfirmDeposit,
  useProcessTermination,
} from "../hooks/useOwnerTenancies";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines which actions are available based on tenancy status for owners
 */
function getOwnerAvailableActions(status: TenancyStatus): {
  canApprove: boolean;
  canReject: boolean;
  canConfirmDeposit: boolean;
  canSignContract: boolean;
  canHandover: boolean;
  canRequestInspection: boolean;
  canProcessTermination: boolean;
} {
  return {
    canApprove: status === TenancyStatus.PENDING_BOOKING,
    canReject: status === TenancyStatus.PENDING_BOOKING,
    canConfirmDeposit: [
      TenancyStatus.PENDING_BOOKING,
      TenancyStatus.PENDING_CONTRACT,
    ].includes(status),
    canSignContract: [
      TenancyStatus.PENDING_CONTRACT,
      TenancyStatus.PENDING_SIGNATURES,
    ].includes(status),
    canHandover: status === TenancyStatus.APPROVED,
    canRequestInspection: [
      TenancyStatus.ACTIVE,
      TenancyStatus.OVERDUE,
      TenancyStatus.TERMINATION_REQUESTED,
      TenancyStatus.TERMINATING,
    ].includes(status),
    canProcessTermination: status === TenancyStatus.TERMINATION_REQUESTED,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerTenancyActionsProps {
  tenancy: TenancyDetail;
  /** Base path for navigation */
  basePath?: string;
  /** Callback after successful action */
  onActionComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Approve Dialog
// ---------------------------------------------------------------------------

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
  onSuccess?: () => void;
}

function ApproveDialog({ open, onOpenChange, tenancy, onSuccess }: ApproveDialogProps) {
  const approveMutation = useApproveTenancy();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ tenancyId: tenancy.id });
      showSuccess("Tenancy booking approved");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      showError("Failed to approve booking");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve this tenancy booking? This will move
            the tenancy to the contract phase.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 text-sm">
          <p><strong>Property:</strong> {tenancy.property.title}</p>
          <p><strong>Monthly Rent:</strong> MYR {tenancy.monthlyRent.toLocaleString()}</p>
          <p><strong>Start Date:</strong> {new Date(tenancy.startDate).toLocaleDateString()}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approveMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveMutation.isPending ? "Approving..." : "Approve Booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Reject Dialog
// ---------------------------------------------------------------------------

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
  onSuccess?: () => void;
}

function RejectDialog({ open, onOpenChange, tenancy, onSuccess }: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectTenancy();

  const handleReject = async () => {
    if (!reason.trim()) {
      showError("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        tenancyId: tenancy.id,
        reason: reason.trim(),
      });
      showSuccess("Tenancy booking rejected");
      onOpenChange(false);
      setReason("");
      onSuccess?.();
    } catch (error) {
      showError("Failed to reject booking");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reject Booking
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this booking. The partner will
            be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Reason for Rejection</Label>
            <Textarea
              id="rejectReason"
              placeholder="E.g., Property no longer available, unsuitable partner profile..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending || !reason.trim()}
          >
            {rejectMutation.isPending ? "Rejecting..." : "Reject Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Confirm Deposit Dialog
// ---------------------------------------------------------------------------

interface ConfirmDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
  onSuccess?: () => void;
}

function ConfirmDepositDialog({
  open,
  onOpenChange,
  tenancy,
  onSuccess,
}: ConfirmDepositDialogProps) {
  const [depositType, setDepositType] = useState<"SECURITY" | "UTILITY" | "KEY">("SECURITY");
  const [amount, setAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);

  const confirmDeposit = useConfirmDeposit();

  // Get suggested amounts based on tenancy
  const suggestedAmounts = {
    SECURITY: tenancy.securityDeposit,
    UTILITY: tenancy.utilityDeposit,
    KEY: 200, // Default key deposit
  };

  const handleTypeChange = (type: "SECURITY" | "UTILITY" | "KEY") => {
    setDepositType(type);
    setAmount(suggestedAmounts[type].toString());
  };

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    try {
      await confirmDeposit.mutateAsync({
        tenancyId: tenancy.id,
        depositType,
        amount: numAmount,
        receivedAt: receivedDate,
      });
      showSuccess(`${depositType.toLowerCase()} deposit confirmed`);
      onOpenChange(false);
      setAmount("");
      onSuccess?.();
    } catch (error) {
      showError("Failed to confirm deposit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Confirm Deposit Received
          </DialogTitle>
          <DialogDescription>
            Record a deposit payment received from the partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="depositType">Deposit Type</Label>
            <Select value={depositType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select deposit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECURITY">
                  Security Deposit (MYR {tenancy.securityDeposit.toLocaleString()})
                </SelectItem>
                <SelectItem value="UTILITY">
                  Utility Deposit (MYR {tenancy.utilityDeposit.toLocaleString()})
                </SelectItem>
                <SelectItem value="KEY">Key Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Received (MYR)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedDate">Date Received</Label>
            <Input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirmDeposit.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirmDeposit.isPending || !amount}
            className="bg-green-600 hover:bg-green-700"
          >
            {confirmDeposit.isPending ? "Confirming..." : "Confirm Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Process Termination Dialog
// ---------------------------------------------------------------------------

interface ProcessTerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
  onSuccess?: () => void;
}

function ProcessTerminationDialog({
  open,
  onOpenChange,
  tenancy,
  onSuccess,
}: ProcessTerminationDialogProps) {
  const [moveOutDate, setMoveOutDate] = useState("");
  const [deductions, setDeductions] = useState<
    { type: string; amount: string; reason: string }[]
  >([]);

  const processTermination = useProcessTermination();

  const addDeduction = () => {
    setDeductions([...deductions, { type: "", amount: "", reason: "" }]);
  };

  const updateDeduction = (
    index: number,
    field: "type" | "amount" | "reason",
    value: string
  ) => {
    const updated = [...deductions];
    updated[index][field] = value;
    setDeductions(updated);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!moveOutDate) {
      showError("Please select a move-out date");
      return;
    }

    try {
      const validDeductions = deductions
        .filter((d) => d.type && d.amount && d.reason)
        .map((d) => ({
          type: d.type,
          amount: parseFloat(d.amount),
          reason: d.reason,
        }));

      await processTermination.mutateAsync({
        tenancyId: tenancy.id,
        moveOutDate,
        deductions: validDeductions.length > 0 ? validDeductions : undefined,
      });

      showSuccess("Termination processed");
      onOpenChange(false);
      setMoveOutDate("");
      setDeductions([]);
      onSuccess?.();
    } catch (error) {
      showError("Failed to process termination");
    }
  };

  const totalDeductions = deductions.reduce(
    (sum, d) => sum + (parseFloat(d.amount) || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-amber-600" />
            Process Termination
          </DialogTitle>
          <DialogDescription>
            Confirm the move-out date and any deposit deductions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="moveOutDate">Confirmed Move-out Date</Label>
            <Input
              id="moveOutDate"
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Deposit Deductions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                Add Deduction
              </Button>
            </div>

            {deductions.map((deduction, index) => (
              <div key={index} className="space-y-2 rounded-md border p-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={deduction.type}
                      onValueChange={(v) => updateDeduction(index, "type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAMAGE">Property Damage</SelectItem>
                        <SelectItem value="CLEANING">Cleaning</SelectItem>
                        <SelectItem value="UNPAID_RENT">Unpaid Rent</SelectItem>
                        <SelectItem value="UNPAID_UTILITY">Unpaid Utilities</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={deduction.amount}
                      onChange={(e) => updateDeduction(index, "amount", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeduction(index)}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Reason for deduction"
                  value={deduction.reason}
                  onChange={(e) => updateDeduction(index, "reason", e.target.value)}
                />
              </div>
            ))}

            {deductions.length > 0 && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span className="font-semibold">MYR {totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Security Deposit:</span>
                  <span>MYR {tenancy.securityDeposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Refundable:</span>
                  <span>
                    MYR {Math.max(0, tenancy.securityDeposit - totalDeductions).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processTermination.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={processTermination.isPending || !moveOutDate}
            variant="destructive"
          >
            {processTermination.isPending ? "Processing..." : "Process Termination"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OwnerTenancyActions({
  tenancy,
  basePath = "/dashboard/vendor/tenancies",
  onActionComplete,
}: OwnerTenancyActionsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);

  const actions = getOwnerAvailableActions(tenancy.status);

  // If no actions available, return null
  const hasAnyAction = Object.values(actions).some(Boolean);
  if (!hasAnyAction) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary actions based on status */}
        {actions.canApprove && (
          <Button
            onClick={() => setShowApproveDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}

        {actions.canReject && (
          <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        )}

        {actions.canConfirmDeposit && (
          <Button variant="outline" onClick={() => setShowDepositDialog(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Confirm Deposit
          </Button>
        )}

        {actions.canSignContract && (
          <Button variant="outline" asChild>
            <Link href={`${basePath}/${tenancy.id}/contract`}>
              <FileSignature className="mr-2 h-4 w-4" />
              Sign Contract
            </Link>
          </Button>
        )}

        {actions.canHandover && (
          <Button variant="outline" asChild>
            <Link href={`${basePath}/${tenancy.id}/handover`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Handover Checklist
            </Link>
          </Button>
        )}

        {actions.canProcessTermination && (
          <Button variant="destructive" onClick={() => setShowTerminationDialog(true)}>
            <LogOut className="mr-2 h-4 w-4" />
            Process Termination
          </Button>
        )}

        {/* Dropdown for additional actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.canRequestInspection && (
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/${tenancy.id}/inspection`}>
                  <Search className="mr-2 h-4 w-4" />
                  Request Inspection
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`${basePath}/${tenancy.id}/history`}>
                <Calendar className="mr-2 h-4 w-4" />
                View History
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <ApproveDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        tenancy={tenancy}
        onSuccess={onActionComplete}
      />
      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        tenancy={tenancy}
        onSuccess={onActionComplete}
      />
      <ConfirmDepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        tenancy={tenancy}
        onSuccess={onActionComplete}
      />
      <ProcessTerminationDialog
        open={showTerminationDialog}
        onOpenChange={setShowTerminationDialog}
        tenancy={tenancy}
        onSuccess={onActionComplete}
      />
    </>
  );
}
