"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, Mail, Phone, Shield, User as UserIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminDeactivateUser,
  useAdminUpdateUser,
  useAdminUserDetail,
} from "@/modules/admin/hooks/admin-users";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="col-span-2 h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
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
    return "-";
  }
}

export function PartnerUserDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;
  const { user: authUser } = useAuth();
  const partnerScope = authUser?.partnerId ?? undefined;
  const deactivateUser = useAdminDeactivateUser();
  const updateUser = useAdminUpdateUser();

  const { data: user, isLoading, error } = useAdminUserDetail(userId, {
    partnerScope,
  });

  const isSuspended = user?.status === "SUSPENDED" || user?.status === "DEACTIVATED";

  const handleSuspend = async () => {
    try {
      await deactivateUser.mutateAsync(userId);
      showSuccess("User suspended", {
        description: `${user?.fullName ?? "User"} has been deactivated.`,
      });
    } catch {
      showError("Failed to suspend user", {
        description: "Please try again.",
      });
    }
  };

  const handleReactivate = async () => {
    try {
      await updateUser.mutateAsync({ id: userId, status: "ACTIVE" });
      showSuccess("User reactivated", {
        description: `${user?.fullName ?? "User"} has been reactivated.`,
      });
    } catch {
      showError("Failed to reactivate user", {
        description: "Please try again.",
      });
    }
  };

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Detail" description="Unable to load user details." />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load user details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/partner/users")}
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.fullName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isSuspended ? (
            <Button onClick={handleReactivate} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Reactivating..." : "Reactivate User"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={deactivateUser.isPending}
            >
              {deactivateUser.isPending ? "Suspending..." : "Suspend User"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.phone || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{ROLE_LABELS[user.role] ?? user.role}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline">{user.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{formatFullDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatFullDate(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
