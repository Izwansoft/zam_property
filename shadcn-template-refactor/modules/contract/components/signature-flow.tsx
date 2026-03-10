// =============================================================================
// SignatureFlow — Interactive signature progress component
// =============================================================================
// Shows who has signed, pending signatures highlighted, and sign button
// for the current user. Supports real-time updates.
// =============================================================================

"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  Pen,
  AlertCircle,
  UserCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { ContractSigner, ContractDetail } from "../types";
import { SignerStatus, SignerRole, ContractStatus } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SignatureFlowProps {
  /** Full contract details */
  contract: ContractDetail;
  /** Current user ID for highlighting */
  currentUserId?: string;
  /** Callback when user clicks sign button */
  onSign?: () => void;
  /** Whether signing is in progress */
  isSigningPending?: boolean;
  /** Whether to show the compact view */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<SignerRole, string> = {
  [SignerRole.OWNER]: "Owner/Landlord",
  [SignerRole.TENANT]: "Partner",
  [SignerRole.WITNESS]: "Witness",
  [SignerRole.GUARANTOR]: "Guarantor",
};

const ROLE_SHORT_LABELS: Record<SignerRole, string> = {
  [SignerRole.OWNER]: "Owner",
  [SignerRole.TENANT]: "Partner",
  [SignerRole.WITNESS]: "Witness",
  [SignerRole.GUARANTOR]: "Guarantor",
};

const STATUS_CONFIG: Record<
  SignerStatus,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  [SignerStatus.PENDING]: {
    icon: Clock,
    label: "Awaiting Signature",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  [SignerStatus.VIEWED]: {
    icon: Eye,
    label: "Viewed Document",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
  [SignerStatus.SIGNED]: {
    icon: CheckCircle2,
    label: "Signed",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  [SignerStatus.DECLINED]: {
    icon: XCircle,
    label: "Declined",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSignedDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SignerWithState = ContractSigner & {
  isCurrentUser: boolean;
  isPending: boolean;
  isNextInOrder: boolean;
  canSign: boolean;
};

// ---------------------------------------------------------------------------
// SignatureFlow Component
// ---------------------------------------------------------------------------

export function SignatureFlow({
  contract,
  currentUserId,
  onSign,
  isSigningPending,
  compact = false,
}: SignatureFlowProps) {
  // Calculate signing progress and state
  const {
    sortedSigners,
    signedCount,
    totalSigners,
    progressPercent,
    currentUserSigner,
    allSigned,
    isFullyExecuted,
  } = useMemo(() => {
    const signers = contract.signers || [];
    const sorted = [...signers].sort((a, b) => a.order - b.order);
    const signed = sorted.filter((s) => s.status === SignerStatus.SIGNED).length;
    const total = sorted.length;

    // Find highest signed order
    const highestSignedOrder = Math.max(
      ...sorted.filter((s) => s.status === SignerStatus.SIGNED).map((s) => s.order),
      -1
    );

    // Determine next in line
    const nextPendingIndex = sorted.findIndex(
      (s) =>
        s.status !== SignerStatus.SIGNED &&
        s.status !== SignerStatus.DECLINED
    );
    const nextOrderToSign = nextPendingIndex >= 0 ? sorted[nextPendingIndex].order : -1;

    // Map signers with additional state
    const withState: SignerWithState[] = sorted.map((signer) => {
      const isCurrentUser = signer.userId === currentUserId;
      const isPending =
        signer.status !== SignerStatus.SIGNED &&
        signer.status !== SignerStatus.DECLINED;
      const isNextInOrder = signer.order === nextOrderToSign;
      const canSign = isCurrentUser && isPending && (
        // Either is next in order OR orders are equal (parallel signing)
        isNextInOrder || signer.order <= highestSignedOrder + 1
      );

      return { ...signer, isCurrentUser, isPending, isNextInOrder, canSign };
    });

    const currentUser = withState.find((s) => s.userId === currentUserId);

    return {
      sortedSigners: withState,
      signedCount: signed,
      totalSigners: total,
      progressPercent: total > 0 ? (signed / total) * 100 : 0,
      currentUserSigner: currentUser,
      allSigned: signed === total && total > 0,
      isFullyExecuted: contract.status === ContractStatus.SIGNED,
    };
  }, [contract.signers, contract.status, currentUserId]);

  // Check if current user can sign
  const canCurrentUserSign =
    currentUserSigner?.canSign &&
    contract.status !== ContractStatus.SIGNED &&
    contract.status !== ContractStatus.VOIDED &&
    contract.status !== ContractStatus.EXPIRED;

  if (compact) {
    return (
      <CompactSignatureFlow
        sortedSigners={sortedSigners}
        signedCount={signedCount}
        totalSigners={totalSigners}
        progressPercent={progressPercent}
        canSign={canCurrentUserSign}
        onSign={onSign}
        isSigningPending={isSigningPending}
        isFullyExecuted={isFullyExecuted}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              Signature Progress
              {isFullyExecuted && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {allSigned
                ? "All parties have signed the contract"
                : `${signedCount} of ${totalSigners} signatures collected`}
            </CardDescription>
          </div>
          {canCurrentUserSign && (
            <Button onClick={onSign} disabled={isSigningPending} size="sm">
              <Pen className="mr-2 h-4 w-4" />
              {isSigningPending ? "Signing..." : "Sign Now"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {signedCount}/{totalSigners} signatures
          </p>
        </div>

        {/* Signer Flow */}
        <div className="flex flex-wrap items-center gap-2">
          {sortedSigners.map((signer, index) => (
            <div key={signer.id} className="flex items-center">
              <SignerBadge
                signer={signer}
                showArrow={index < sortedSigners.length - 1}
              />
            </div>
          ))}
        </div>

        {/* Detailed Signer List */}
        <div className="space-y-3">
          {sortedSigners.map((signer) => (
            <SignerRow key={signer.id} signer={signer} />
          ))}
        </div>

        {/* Call to Action for Current User */}
        {canCurrentUserSign && (
          <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Pen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Your signature is required</p>
                <p className="text-sm text-muted-foreground">
                  Please review the contract and sign to proceed
                </p>
              </div>
              <Button onClick={onSign} disabled={isSigningPending}>
                {isSigningPending ? "Signing..." : "Sign Contract"}
              </Button>
            </div>
          </div>
        )}

        {/* Fully Executed Message */}
        {isFullyExecuted && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Contract Fully Executed!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All parties have signed. The tenancy agreement is now active.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compact Signature Flow
// ---------------------------------------------------------------------------

interface CompactSignatureFlowProps {
  sortedSigners: SignerWithState[];
  signedCount: number;
  totalSigners: number;
  progressPercent: number;
  canSign?: boolean;
  onSign?: () => void;
  isSigningPending?: boolean;
  isFullyExecuted: boolean;
}

function CompactSignatureFlow({
  sortedSigners,
  signedCount,
  totalSigners,
  progressPercent,
  canSign,
  onSign,
  isSigningPending,
  isFullyExecuted,
}: CompactSignatureFlowProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Signatures</span>
            <Badge variant={isFullyExecuted ? "default" : "secondary"}>
              {signedCount}/{totalSigners}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {sortedSigners.map((signer, index) => (
              <div key={signer.id} className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <SignerDot signer={signer} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{signer.name} ({ROLE_SHORT_LABELS[signer.role]})</p>
                      <p className="text-xs text-muted-foreground">
                        {STATUS_CONFIG[signer.status].label}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {index < sortedSigners.length - 1 && (
                  <ArrowRight className="mx-0.5 h-3 w-3 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
        {canSign && (
          <Button size="sm" onClick={onSign} disabled={isSigningPending}>
            <Pen className="mr-1.5 h-3.5 w-3.5" />
            Sign
          </Button>
        )}
        {isFullyExecuted && (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Complete
          </Badge>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signer Badge (Flow visualization)
// ---------------------------------------------------------------------------

interface SignerBadgeProps {
  signer: SignerWithState;
  showArrow?: boolean;
}

function SignerBadge({ signer, showArrow }: SignerBadgeProps) {
  const config = STATUS_CONFIG[signer.status];
  const Icon = config.icon;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                config.bgColor,
                signer.isCurrentUser && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className={signer.isPending ? "text-muted-foreground" : ""}>
                {ROLE_SHORT_LABELS[signer.role]}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">{signer.name}</p>
            <p className="text-xs text-muted-foreground">
              {config.label}
              {signer.signedAt && ` • ${formatSignedDate(signer.signedAt)}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {showArrow && (
        <ArrowRight className="mx-1 h-4 w-4 text-muted-foreground/50" />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Signer Dot (Compact view)
// ---------------------------------------------------------------------------

interface SignerDotProps {
  signer: SignerWithState;
}

function SignerDot({ signer }: SignerDotProps) {
  const config = STATUS_CONFIG[signer.status];

  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full",
        config.bgColor,
        signer.isCurrentUser && "ring-2 ring-primary ring-offset-1"
      )}
    >
      {signer.status === SignerStatus.SIGNED ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : signer.status === SignerStatus.DECLINED ? (
        <XCircle className="h-4 w-4 text-red-600" />
      ) : signer.status === SignerStatus.VIEWED ? (
        <Eye className="h-3.5 w-3.5 text-yellow-600" />
      ) : (
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signer Row (Detailed list)
// ---------------------------------------------------------------------------

interface SignerRowProps {
  signer: SignerWithState;
}

function SignerRow({ signer }: SignerRowProps) {
  const config = STATUS_CONFIG[signer.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-3 transition-colors",
        signer.isCurrentUser && "border-primary bg-primary/5",
        signer.isPending && signer.isNextInOrder && !signer.isCurrentUser && "bg-muted/50"
      )}
    >
      {/* Avatar/Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Signer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{signer.name}</p>
          {signer.isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[signer.role]}
        </p>
      </div>

      {/* Status */}
      <div className="text-right">
        <Badge
          variant={
            signer.status === SignerStatus.SIGNED
              ? "default"
              : signer.status === SignerStatus.DECLINED
                ? "destructive"
                : "secondary"
          }
          className={
            signer.status === SignerStatus.SIGNED
              ? "bg-green-600"
              : undefined
          }
        >
          {config.label}
        </Badge>
        {signer.signedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatSignedDate(signer.signedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default SignatureFlow;
