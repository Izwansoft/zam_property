// =============================================================================
// ClaimReviewPanel — Owner component to review claims (approve/reject)
// =============================================================================
// Shows in the owner's claim detail view. Owner can approve, partially
// approve, or reject the claim with notes and adjusted amounts.
// =============================================================================

"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Scale,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useReviewClaim } from "../hooks";
import {
  ClaimStatus,
  canReviewClaim,
  formatClaimAmount,
} from "../types";
import type { Claim } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimReviewPanelProps {
  claim: Claim;
  /** Callback after review action completes */
  onReviewComplete?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimReviewPanel({
  claim,
  onReviewComplete,
  className = "",
}: ClaimReviewPanelProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number>(0);

  const reviewMutation = useReviewClaim(claim.id);

  // Only show when claim can be reviewed
  if (!canReviewClaim(claim)) {
    // Show status-specific info
    if (
      claim.status === ClaimStatus.APPROVED ||
      claim.status === ClaimStatus.PARTIALLY_APPROVED
    ) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Claim Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>
                {claim.status === ClaimStatus.APPROVED
                  ? "Claim Approved"
                  : "Claim Partially Approved"}
              </AlertTitle>
              <AlertDescription>
                This claim has been reviewed and{" "}
                {claim.status === ClaimStatus.APPROVED
                  ? `approved for ${formatClaimAmount(claim.claimedAmount)}.`
                  : `partially approved for ${formatClaimAmount(claim.approvedAmount ?? 0)} of ${formatClaimAmount(claim.claimedAmount)} claimed.`}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (claim.status === ClaimStatus.REJECTED) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Claim Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Claim Rejected</AlertTitle>
              <AlertDescription>
                This claim has been rejected.
                {claim.reviewNotes && (
                  <span className="block mt-1">{claim.reviewNotes}</span>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (claim.status === ClaimStatus.SETTLED) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Claim Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Claim Settled</AlertTitle>
              <AlertDescription>
                This claim has been settled and no further action is required.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  // Handle approve
  const handleApprove = async () => {
    try {
      await reviewMutation.mutateAsync({
        decision: "APPROVED",
        approvedAmount: claim.claimedAmount,
        notes: notes || undefined,
      });
      setShowApproveDialog(false);
      setNotes("");
      onReviewComplete?.();
    } catch {
      // Error handled by mutation
    }
  };

  // Handle partial approval
  const handlePartialApprove = async () => {
    try {
      await reviewMutation.mutateAsync({
        decision: "PARTIALLY_APPROVED",
        approvedAmount,
        notes: notes || undefined,
      });
      setShowPartialDialog(false);
      setNotes("");
      setApprovedAmount(0);
      onReviewComplete?.();
    } catch {
      // Error handled by mutation
    }
  };

  // Handle reject
  const handleReject = async () => {
    try {
      await reviewMutation.mutateAsync({
        decision: "REJECTED",
        notes: notes || undefined,
      });
      setShowRejectDialog(false);
      setNotes("");
      onReviewComplete?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4" />
            Review Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claim.isDisputed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Disputed</AlertTitle>
              <AlertDescription>
                The previous decision was disputed. Please review again.
                {claim.disputeReason && (
                  <span className="block mt-1 font-medium">
                    Reason: {claim.disputeReason}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claimed Amount</span>
              <span className="font-medium">
                {formatClaimAmount(claim.claimedAmount)}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Review the claim details and evidence, then choose an action below.
          </p>

          {/* Mutation error */}
          {reviewMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {reviewMutation.error.message || "Failed to submit review"}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowApproveDialog(true)}
              disabled={reviewMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve Full
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setApprovedAmount(Math.floor(claim.claimedAmount * 0.5 * 100) / 100);
                setShowPartialDialog(true);
              }}
              disabled={reviewMutation.isPending}
            >
              <Scale className="mr-2 h-4 w-4" />
              Partial Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={reviewMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
            <DialogDescription>
              Approve the full claimed amount of{" "}
              {formatClaimAmount(claim.claimedAmount)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="approve-notes">Notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes about the approval..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial Approve Dialog */}
      <Dialog open={showPartialDialog} onOpenChange={setShowPartialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partially Approve Claim</DialogTitle>
            <DialogDescription>
              Approve a reduced amount for this claim. Claimed:{" "}
              {formatClaimAmount(claim.claimedAmount)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="partial-amount">Approved Amount (RM)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  RM
                </span>
                <Input
                  id="partial-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={claim.claimedAmount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
              {approvedAmount >= claim.claimedAmount && (
                <p className="mt-1 text-xs text-destructive">
                  Amount must be less than claimed amount. Use &quot;Approve
                  Full&quot; instead.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="partial-notes">Notes (optional)</Label>
              <Textarea
                id="partial-notes"
                placeholder="Explain why the amount was adjusted..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPartialDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePartialApprove}
              disabled={
                reviewMutation.isPending ||
                approvedAmount <= 0 ||
                approvedAmount >= claim.claimedAmount
              }
            >
              {reviewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Scale className="mr-2 h-4 w-4" />
              )}
              Confirm Partial Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this claim for{" "}
              {formatClaimAmount(claim.claimedAmount)}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reject-notes">Reason for rejection</Label>
              <Textarea
                id="reject-notes"
                placeholder="Explain why this claim is being rejected..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
