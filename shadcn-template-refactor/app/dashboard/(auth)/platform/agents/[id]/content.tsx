// =============================================================================
// Platform Agent Detail — Client Content
// =============================================================================
// Shows full agent profile for Platform Admin, including assigned listings.
// Backend: GET /api/v1/agents/:id
// =============================================================================

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Hash,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldBan,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageHeader } from "@/components/common/page-header";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  useAgent,
  useSuspendAgent,
  useReactivateAgent,
  useRegenerateReferralCode,
} from "@/modules/agent/hooks/useAgents";
import { EditAgentDialog } from "@/modules/agent/components/edit-agent-dialog";
import { AGENT_STATUS_CONFIG } from "@/modules/agent/types";
import { showInfo } from "@/lib/errors/toast-helpers";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AgentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${muted ? "text-muted-foreground" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformAgentDetailContent({
  agentId: agentIdProp,
  backHref,
}: {
  agentId?: string;
  backHref?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = agentIdProp ?? params.id;
  const { data: agent, isLoading, error } = useAgent(id);

  // --- Mutation hooks ---
  const suspendAgent = useSuspendAgent();
  const reactivateAgent = useReactivateAgent();
  const regenReferral = useRegenerateReferralCode();

  // --- Dialog state ---
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "suspend" | "reactivate" | "regenerate">(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (isLoading) return <AgentDetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Failed to load Agent</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Agent not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The agent you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = AGENT_STATUS_CONFIG[agent.status] ?? {
    label: agent.status,
    variant: "outline" as const,
  };
  const agentName = agent.user?.fullName ?? "Unknown Agent";
  const agentEmail = agent.user?.email ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 mt-1"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className={cn("text-lg font-semibold", getAvatarFallbackClass(agentName))}>
            {getInitials(agentName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {agentName}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {agentEmail}
            {agent.renNumber ? ` • REN: ${agent.renNumber}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Details */}
        <div className="col-span-2 space-y-6">
          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Information</CardTitle>
              <CardDescription>Personal and professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={User} label="Full Name" value={agentName} />
              <Separator />
              <InfoRow icon={Mail} label="Email" value={agentEmail} />
              <Separator />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={agent.user?.phone || "Not provided"}
                muted={!agent.user?.phone}
              />
              <Separator />
              <InfoRow
                icon={FileText}
                label="REN Number"
                value={agent.renNumber || "Not registered"}
                muted={!agent.renNumber}
              />
              {agent.renExpiry && (
                <>
                  <Separator />
                  <InfoRow
                    icon={Calendar}
                    label="REN Expiry"
                    value={formatFullDate(agent.renExpiry)}
                  />
                </>
              )}
              <Separator />
              <InfoRow
                icon={Tag}
                label="Vertical"
                value={agent.verticalType || "Not set"}
                muted={!agent.verticalType}
              />
              <Separator />
              <InfoRow
                icon={Building2}
                label="Company"
                value={
                  agent.company ? (
                    <span>
                      {agent.company.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({agent.company.type})
                      </span>
                    </span>
                  ) : (
                    "Independent"
                  )
                }
                muted={!agent.company}
              />
              {agent.referralCode && (
                <>
                  <Separator />
                  <InfoRow icon={Hash} label="Referral Code" value={agent.referralCode} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance & Metrics</CardTitle>
              <CardDescription>Sales and engagement stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{agent.totalListings}</p>
                  <p className="text-xs text-muted-foreground">Listings</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{agent.totalDeals}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{formatCurrency(agent.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Assigned Listings ({agent.agentListings?.length ?? 0})
                </div>
              </CardTitle>
              <CardDescription>Listings currently managed by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.agentListings && agent.agentListings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agent.agentListings
                      .filter((al) => !al.removedAt)
                      .map((al) => (
                        <TableRow key={al.id}>
                          <TableCell>
                            <p className="font-medium text-sm truncate max-w-60">
                              {al.listing?.title ?? al.listingId}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{al.listing?.status ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {al.listing?.price
                              ? formatCurrency(al.listing.price)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatRelativeTime(al.assignedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No listings assigned yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity & Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={Calendar}
                label="Registered"
                value={
                  <span>
                    {formatFullDate(agent.createdAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(agent.createdAt)})
                    </span>
                  </span>
                }
              />
              <Separator />
              <InfoRow
                icon={RefreshCw}
                label="Last Updated"
                value={
                  <span>
                    {formatFullDate(agent.updatedAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(agent.updatedAt)})
                    </span>
                  </span>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — Status & Meta */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    agent.status === "ACTIVE"
                      ? "bg-emerald-500/10"
                      : agent.status === "SUSPENDED"
                        ? "bg-destructive/10"
                        : "bg-muted"
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${
                      agent.status === "ACTIVE"
                        ? "text-emerald-600"
                        : agent.status === "SUSPENDED"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <Badge variant={statusConfig.variant} className="mb-1">
                    {statusConfig.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {agent.status === "ACTIVE"
                      ? "Agent can manage listings and clients"
                      : agent.status === "SUSPENDED"
                        ? "Agent access has been temporarily revoked"
                        : "Agent is currently inactive"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                {agent.status !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction("suspend")}
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Suspend Agent
                  </Button>
                )}
                {agent.status === "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConfirmAction("reactivate")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivate Agent
                  </Button>
                )}
                {agent.referralCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConfirmAction("regenerate")}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Regenerate Referral Code
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {agent.id}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {agent.userId}
                  </span>
                </div>
                {agent.companyId && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company ID</span>
                      <span className="font-mono text-muted-foreground truncate max-w-40">
                        {agent.companyId}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {agent && <EditAgentDialog open={editOpen} onOpenChange={setEditOpen} agent={agent} />}

      {/* Confirmation Dialogs */}
      <ConfirmActionDialog
        open={confirmAction === "suspend"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Suspend Agent"
        description={`Are you sure you want to suspend "${agentName}"? They will lose access to manage listings.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        isPending={suspendAgent.isPending}
        onConfirm={() => suspendAgent.mutate(agent.id, { onSuccess: () => setConfirmAction(null) })}
      />
      <ConfirmActionDialog
        open={confirmAction === "reactivate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reactivate Agent"
        description={`Are you sure you want to reactivate "${agentName}"? They will regain access to manage listings.`}
        confirmLabel="Reactivate"
        isPending={reactivateAgent.isPending}
        onConfirm={() => reactivateAgent.mutate(agent.id, { onSuccess: () => setConfirmAction(null) })}
      />
      <ConfirmActionDialog
        open={confirmAction === "regenerate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Regenerate Referral Code"
        description={`This will generate a new referral code for "${agentName}". The old code will stop working.`}
        confirmLabel="Regenerate"
        isPending={regenReferral.isPending}
        onConfirm={() => regenReferral.mutate(agent.id, { onSuccess: () => setConfirmAction(null) })}
      />
    </div>
  );
}
