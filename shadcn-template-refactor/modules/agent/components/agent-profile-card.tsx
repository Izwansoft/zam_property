// =============================================================================
// AgentProfileCard — Detailed agent profile for detail page
// =============================================================================

"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  FileText,
  HandCoins,
  BadgeDollarSign,
  Copy,
  Check,
  Ban,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { AgentDetail } from "../types";
import { AGENT_STATUS_CONFIG, getAgentDisplayName, formatRenInfo } from "../types";
import {
  useSuspendAgent,
  useReactivateAgent,
  useRegenerateReferralCode,
} from "../hooks/useAgents";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentProfileCardProps {
  agent: AgentDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentProfileCard({ agent }: AgentProfileCardProps) {

  const [copiedReferral, setCopiedReferral] = useState(false);

  const suspendAgent = useSuspendAgent();
  const reactivateAgent = useReactivateAgent();
  const regenerateReferral = useRegenerateReferralCode();

  const statusConfig = AGENT_STATUS_CONFIG[agent.status];
  const displayName = getAgentDisplayName(agent);
  const renInfo = formatRenInfo(agent);

  const handleCopyReferral = async () => {
    if (agent.referralCode) {
      await navigator.clipboard.writeText(agent.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
      showSuccess("Referral code copied");
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendAgent.mutateAsync(agent.id);
      showSuccess("Agent suspended");
    } catch {
      showError("Failed to suspend agent");
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateAgent.mutateAsync(agent.id);
      showSuccess("Agent reactivated");
    } catch {
      showError("Failed to reactivate agent");
    }
  };

  const handleRegenerateReferral = async () => {
    try {
      await regenerateReferral.mutateAsync(agent.id);
      showSuccess("Referral code regenerated");
    } catch {
      showError("Failed to regenerate referral code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">{displayName}</CardTitle>
                <CardDescription>
                  {agent.company?.name ?? "Independent Agent"} &middot; Agent
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusConfig.variant} className="text-sm">
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{agent.user.email}</span>
            </div>
            {agent.user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{agent.user.phone}</span>
              </div>
            )}
          </div>

          {/* REN Info */}
          {renInfo && (
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span>{renInfo}</span>
            </div>
          )}

          {/* Joined date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {agent.totalListings}
              </div>
              <p className="text-xs text-muted-foreground">Listings</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <HandCoins className="h-5 w-5 text-muted-foreground" />
                {agent.totalDeals}
              </div>
              <p className="text-xs text-muted-foreground">Deals</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <BadgeDollarSign className="h-5 w-5 text-muted-foreground" />
                {Number(agent.totalRevenue).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Revenue (RM)</p>
            </div>
          </div>

          <Separator />

          {/* Referral Code */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Referral Code</p>
              {agent.referralCode ? (
                <p className="font-mono text-sm text-muted-foreground">
                  {agent.referralCode}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No referral code</p>
              )}
            </div>
            <div className="flex gap-2">
              {agent.referralCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReferral}
                >
                  {copiedReferral ? (
                    <Check className="mr-1 h-3 w-3" />
                  ) : (
                    <Copy className="mr-1 h-3 w-3" />
                  )}
                  {copiedReferral ? "Copied" : "Copy"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateReferral}
                disabled={regenerateReferral.isPending}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                {regenerateReferral.isPending ? "..." : "Regenerate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {agent.status === "ACTIVE" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSuspend}
              disabled={suspendAgent.isPending}
            >
              <Ban className="mr-2 h-4 w-4" />
              {suspendAgent.isPending ? "Suspending..." : "Suspend Agent"}
            </Button>
          )}
          {(agent.status === "SUSPENDED" || agent.status === "INACTIVE") && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReactivate}
              disabled={reactivateAgent.isPending}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {reactivateAgent.isPending ? "Reactivating..." : "Reactivate Agent"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function AgentProfileCardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
          <Separator />
          <div className="grid grid-cols-3 gap-4 text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="mx-auto h-8 w-16" />
                <Skeleton className="mx-auto h-3 w-12" />
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
    </div>
  );
}
