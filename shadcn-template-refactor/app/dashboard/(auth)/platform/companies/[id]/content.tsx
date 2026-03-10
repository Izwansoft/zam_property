// =============================================================================
// Platform Company Detail — Client Content
// =============================================================================
// Shows full company profile for Platform Admin, including admins list.
// Backend: GET /api/v1/companies/:id
// =============================================================================

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2,
  Calendar,
  FileText,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldBan,
  User,
  Users,
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
import { useCompany, useVerifyCompany, useSuspendCompany } from "@/modules/company/hooks/useCompany";
import { useAgents } from "@/modules/agent/hooks/useAgents";
import { EditCompanyDialog } from "@/modules/company/components/edit-company-dialog";
import {
  COMPANY_TYPE_CONFIG,
  COMPANY_STATUS_CONFIG,
  COMPANY_ADMIN_ROLE_CONFIG,
  type CompanyAdmin,
} from "@/modules/company/types";
import { showInfo } from "@/lib/errors/toast-helpers";
import Link from "next/link";
import { AGENT_STATUS_CONFIG, type AgentStatus } from "@/modules/agent/types";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function CompanyDetailSkeleton() {
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
// Company Agents Sub-Component
// ---------------------------------------------------------------------------

function CompanyAgents({ companyId }: { companyId: string }) {
  const { data, isLoading } = useAgents({ companyId, limit: 10 });
  const agents = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Agents ({isLoading ? "…" : (data?.pagination?.total ?? agents.length)})
        </CardTitle>
        <CardDescription>Agents registered under this company</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : agents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>REN</TableHead>
                <TableHead>Listings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const statusCfg =
                  AGENT_STATUS_CONFIG[agent.status as AgentStatus] ??
                  AGENT_STATUS_CONFIG.ACTIVE;
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/platform/agents/${agent.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {agent.user?.fullName ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {agent.renNumber ?? "—"}
                    </TableCell>
                    <TableCell>{agent.totalListings}</TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No agents registered under this company.
          </p>
        )}
      </CardContent>
    </Card>
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

export function PlatformCompanyDetailContent({
  companyId: companyIdProp,
  backHref,
}: {
  companyId?: string;
  backHref?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = companyIdProp ?? params.id;
  const { data: company, isLoading, error } = useCompany(id);

  // --- Mutation hooks ---
  const verifyCompany = useVerifyCompany(id);
  const suspendCompany = useSuspendCompany(id);

  // --- Dialog state ---
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "verify" | "suspend">(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (isLoading) return <CompanyDetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Failed to load Company</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <PageHeader title="Company Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Company not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The company you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const typeConfig = COMPANY_TYPE_CONFIG[company.type] ?? {
    label: company.type,
    description: "",
  };
  const statusConfig = COMPANY_STATUS_CONFIG[company.status] ?? {
    label: company.status,
    variant: "outline" as const,
    description: "Current status",
  };

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
          <AvatarFallback className={cn("text-lg font-semibold", getAvatarFallbackClass(company.name))}>
            {getInitials(company.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {company.name}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {company.registrationNo} • {typeConfig.label}
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
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
              <CardDescription>Registration and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Building2} label="Company Name" value={company.name} />
              <Separator />
              <InfoRow icon={FileText} label="Registration No." value={company.registrationNo} />
              <Separator />
              <InfoRow
                icon={Globe}
                label="Type"
                value={
                  <span className="flex items-center gap-1.5">
                    {typeConfig.label}
                    <span className="text-xs text-muted-foreground">— {typeConfig.description}</span>
                  </span>
                }
              />
              <Separator />
              <InfoRow
                icon={Globe}
                label="Verticals"
                value={
                  company.verticalTypes.length > 0
                    ? company.verticalTypes.map((v) => (
                        <Badge key={v} variant="outline" className="mr-1">
                          {v}
                        </Badge>
                      ))
                    : "None assigned"
                }
                muted={company.verticalTypes.length === 0}
              />
              <Separator />
              <InfoRow icon={Mail} label="Email" value={company.email} />
              <Separator />
              <InfoRow icon={Phone} label="Phone" value={company.phone} />
              <Separator />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={company.address || "Not provided"}
                muted={!company.address}
              />
            </CardContent>
          </Card>

          {/* Company Admins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Company Admins ({company.admins?.length ?? 0})
                </div>
              </CardTitle>
              <CardDescription>Users with administrative access to this company</CardDescription>
            </CardHeader>
            <CardContent>
              {company.admins && company.admins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.admins.map((admin: CompanyAdmin) => {
                      const roleConfig = COMPANY_ADMIN_ROLE_CONFIG[admin.role];
                      return (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {admin.user?.fullName ?? "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {admin.user?.email ?? "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{roleConfig?.label ?? admin.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {admin.isOwner ? (
                              <Badge variant="default">Owner</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatRelativeTime(admin.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No admins assigned yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Company Agents */}
          <CompanyAgents companyId={company.id} />

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
                    {formatFullDate(company.createdAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(company.createdAt)})
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
                    {formatFullDate(company.updatedAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(company.updatedAt)})
                    </span>
                  </span>
                }
              />
              {company.verifiedAt && (
                <>
                  <Separator />
                  <InfoRow
                    icon={Shield}
                    label="Verified"
                    value={formatFullDate(company.verifiedAt)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Status & Meta */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    company.status === "ACTIVE"
                      ? "bg-emerald-500/10"
                      : company.status === "SUSPENDED"
                        ? "bg-destructive/10"
                        : "bg-muted"
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${
                      company.status === "ACTIVE"
                        ? "text-emerald-600"
                        : company.status === "SUSPENDED"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <Badge variant={statusConfig.variant} className="mb-1">
                    {statusConfig.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{statusConfig.description}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                {company.status !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction("suspend")}
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Suspend Company
                  </Button>
                )}
                {company.status === "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                    title="Reactivation requires backend support"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivate Company
                  </Button>
                )}
                {company.status === "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConfirmAction("verify")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Company
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Business License</span>
                </div>
                {company.businessLicense ? (
                  <Badge variant="outline">Uploaded</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not uploaded</span>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">SSM Document</span>
                </div>
                {company.ssmDocument ? (
                  <Badge variant="outline">Uploaded</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not uploaded</span>
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
                  <span className="text-muted-foreground">Company ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {company.id}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partner ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {company.partnerId}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {company && <EditCompanyDialog open={editOpen} onOpenChange={setEditOpen} company={company} />}

      {/* Confirmation Dialogs */}
      <ConfirmActionDialog
        open={confirmAction === "verify"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Verify Company"
        description={`Are you sure you want to verify "${company.name}"? The company status will change to ACTIVE.`}
        confirmLabel="Verify"
        isPending={verifyCompany.isPending}
        onConfirm={() => verifyCompany.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
      />
      <ConfirmActionDialog
        open={confirmAction === "suspend"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Suspend Company"
        description={`Are you sure you want to suspend "${company.name}"? All agents under this company will lose access.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        isPending={suspendCompany.isPending}
        onConfirm={() => suspendCompany.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
      />
    </div>
  );
}
