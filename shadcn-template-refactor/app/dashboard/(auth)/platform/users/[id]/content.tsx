// =============================================================================
// Platform User Detail — Client Content
// =============================================================================
// Shows full user profile for Platform Admin.
// Backend: GET /api/v1/users/:id
// =============================================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Calendar,
  Clock,
  Globe,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldBan,
  Trash2,
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

import { PageHeader } from "@/components/common/page-header";
import { useAdminUserDetail } from "@/modules/admin/hooks/admin-users";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_BADGE_VARIANTS: Record<string, string> = {
  SUPER_ADMIN: "destructive",
  PARTNER_ADMIN: "default",
  VENDOR_ADMIN: "secondary",
  VENDOR_STAFF: "outline",
  CUSTOMER: "outline",
  TENANT: "outline",
  COMPANY_ADMIN: "secondary",
  AGENT: "outline",
  GUEST: "outline",
};

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
  DEACTIVATED: "secondary",
  PENDING: "outline",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "Full platform access with unrestricted permissions across all partners",
  PARTNER_ADMIN: "Administrative access scoped to their partner organization",
  VENDOR_ADMIN: "Manages vendor operations, listings, and staff within a partner",
  VENDOR_STAFF: "Operational support role under a vendor admin",
  CUSTOMER: "End-user browsing and engaging with marketplace listings",
  TENANT: "Property tenant with tenancy and billing management access",
  COMPANY_ADMIN: "Company-level administrator for multi-agent organizations",
  AGENT: "Property agent managing listings and client interactions",
  GUEST: "Limited access, pre-registration or anonymous browsing",
};

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
// Loading Skeleton
// ---------------------------------------------------------------------------

function UserDetailSkeleton() {
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

export function PlatformUserDetailContent({
  userId: userIdProp,
  backHref,
}: {
  /** Override the user ID (defaults to route param `id`) */
  userId?: string;
  /** Explicit back URL (defaults to router.back()) */
  backHref?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = userIdProp ?? params.id;
  const { data: user, isLoading, error } = useAdminUserDetail(userId);
  const updateUser = useApiMutation<unknown, { id: string; status: string }>({
    path: (variables) => `/users/${variables.id}`,
    method: "PATCH",
  });
  const deactivateUser = useApiMutation<unknown, string>({
    path: (id) => `/users/${id}/actions/deactivate`,
    method: "POST",
  });

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Detail"
          onBack={handleBack}
          hideBreadcrumb
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load User
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Detail"
          onBack={handleBack}
          hideBreadcrumb
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">User not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The user you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleBadgeVariant = ROLE_BADGE_VARIANTS[user.role] ?? "outline";
  const statusBadgeVariant = STATUS_BADGE_VARIANTS[user.status] ?? "outline";
  const roleDescription = ROLE_DESCRIPTIONS[user.role] ?? "Standard platform user";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 mt-1"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        {/* Avatar */}
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className={cn("text-lg font-semibold", getAvatarFallbackClass(user.fullName))}>
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {user.fullName}
            </h1>
            <Badge variant={statusBadgeVariant as "default"}>
              {user.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.email}
            {user.phone ? ` • ${user.phone}` : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="User editing requires admin user management endpoint"
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — Profile info */}
        <div className="col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>
                Basic details about this user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={User}
                label="Full Name"
                value={user.fullName}
              />
              <Separator />
              <InfoRow
                icon={Mail}
                label="Email Address"
                value={user.email}
              />
              <Separator />
              <InfoRow
                icon={Phone}
                label="Phone Number"
                value={user.phone || "Not provided"}
                muted={!user.phone}
              />
              <Separator />
              <InfoRow
                icon={Globe}
                label="Partner ID"
                value={
                  <button
                    type="button"
                    className="text-primary hover:underline cursor-pointer text-sm font-medium"
                    onClick={() =>
                      router.push(
                        `/dashboard/platform/partners/${user.partnerId}`
                      )
                    }
                  >
                    {user.partnerId}
                  </button>
                }
              />
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity & Timestamps</CardTitle>
              <CardDescription>
                Account creation and update history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={Calendar}
                label="Account Created"
                value={
                  <span>
                    {formatFullDate(user.createdAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(user.createdAt)})
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
                    {formatFullDate(user.updatedAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(user.updatedAt)})
                    </span>
                  </span>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column — Role & Status */}
        <div className="space-y-6">
          {/* Role Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Badge variant={roleBadgeVariant as "default"} className="mb-1">
                    {roleLabel}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {roleDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-500/10"
                      : user.status === "SUSPENDED"
                        ? "bg-destructive/10"
                        : "bg-muted"
                  }`}
                >
                  <Clock
                    className={`h-5 w-5 ${
                      user.status === "ACTIVE"
                        ? "text-emerald-600"
                        : user.status === "SUSPENDED"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <Badge variant={statusBadgeVariant as "default"} className="mb-1">
                    {user.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {user.status === "ACTIVE"
                      ? "User can access the platform normally"
                      : user.status === "SUSPENDED"
                        ? "User access is temporarily revoked"
                        : user.status === "DEACTIVATED"
                          ? "User account has been permanently disabled"
                          : "Current account state"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Quick Actions
                </p>
                {user.status !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        await updateUser.mutateAsync({ id: user.id, status: "SUSPENDED" });
                        showSuccess("User suspended", {
                          description: `${user.fullName} has been suspended.`,
                        });
                      } catch {
                        showError("Failed to suspend user", {
                          description: "Please try again.",
                        });
                      }
                    }}
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Suspend User
                  </Button>
                )}
                {user.status === "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      try {
                        await updateUser.mutateAsync({ id: user.id, status: "ACTIVE" });
                        showSuccess("User reactivated", {
                          description: `${user.fullName} is active again.`,
                        });
                      } catch {
                        showError("Failed to reactivate user", {
                          description: "Please try again.",
                        });
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivate User
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={async () => {
                    try {
                      await deactivateUser.mutateAsync(user.id);
                      showSuccess("User deactivated", {
                        description: `${user.fullName} has been deactivated.`,
                      });
                    } catch {
                      showError("Failed to deactivate user", {
                        description: "Please try again.",
                      });
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
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
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {user.id}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partner ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {user.partnerId}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
