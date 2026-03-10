// =============================================================================
// Platform Vendor Detail — Client Content
// =============================================================================
// Shows full vendor profile for Platform Admin.
// Backend: GET /api/v1/vendors/:id
// =============================================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftIcon,
  Building,
  Calendar,
  CheckCircle,
  Globe,
  List,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldBan,
  Star,
  Store,
  Tag,
  User,
  XCircle,
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
import { useVendor } from "@/modules/vendor/hooks/use-vendor";
import { useAdminListings } from "@/modules/admin/hooks/admin-listings";
import {
  useApproveVendor,
  useRejectVendor,
  useSuspendVendor,
  useReactivateVendor,
} from "@/modules/vendor/hooks/use-vendor-mutations";
import { EditVendorDialog } from "@/modules/vendor/components/edit-vendor-dialog";
import { LISTING_STATUS_CONFIG } from "@/modules/listing/utils";
import { formatPrice } from "@/modules/listing/utils";
import type { VendorStatus, VendorType } from "@/modules/vendor/types";
import { showInfo } from "@/lib/errors/toast-helpers";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING: "Vendor registration is awaiting review",
  APPROVED: "Vendor is verified and active on the platform",
  REJECTED: "Vendor registration was rejected",
  SUSPENDED: "Vendor access has been temporarily revoked",
};

const TYPE_LABELS: Record<VendorType, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
};

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

function formatAddress(address?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null): string {
  if (!address) return "Not provided";
  const parts = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function VendorDetailSkeleton() {
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
// Vendor Listings sub-component
// ---------------------------------------------------------------------------

function VendorListings({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useAdminListings({ vendorId, pageSize: 10, sortBy: "updatedAt", sortOrder: "desc" });
  const listings = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Listings {!isLoading && `(${data?.pagination?.total ?? listings.length})`}
          </div>
        </CardTitle>
        <CardDescription>Listings managed by this vendor</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => {
                const sc = LISTING_STATUS_CONFIG[listing.status] ?? { label: listing.status, variant: "outline" };
                return (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <p className="font-medium text-sm truncate max-w-60">{listing.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant as "default"}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPrice(listing.price, listing.currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No listings yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformVendorDetailContent({
  vendorId: vendorIdProp,
  backHref,
}: {
  vendorId?: string;
  backHref?: string;
} = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = vendorIdProp ?? params.id;
  const { data: vendor, isLoading, error } = useVendor(id);

  // --- Mutation hooks ---
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const suspendVendor = useSuspendVendor();
  const reactivateVendor = useReactivateVendor();

  // --- Dialog state ---
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | null
    | "approve"
    | "reject"
    | "suspend"
    | "reactivate"
  >(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (isLoading) return <VendorDetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vendor Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Failed to load Vendor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <PageHeader title="Vendor Detail" onBack={handleBack} hideBreadcrumb />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Vendor not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The vendor you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const statusVariant = STATUS_BADGE_VARIANTS[vendor.status] ?? "outline";
  const statusDesc = STATUS_DESCRIPTIONS[vendor.status] ?? "Current vendor state";

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
          <AvatarFallback className={cn("text-lg font-semibold", getAvatarFallbackClass(vendor.name))}>
            {getInitials(vendor.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {vendor.name}
            </h1>
            <Badge variant={statusVariant as "default"}>{vendor.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vendor.email}
            {vendor.phone ? ` • ${vendor.phone}` : ""}
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
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
              <CardDescription>Vendor registration and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={Store} label="Business Name" value={vendor.name} />
              <Separator />
              <InfoRow icon={Tag} label="Slug" value={vendor.slug} />
              <Separator />
              <InfoRow icon={Building} label="Type" value={TYPE_LABELS[vendor.type] ?? vendor.type} />
              <Separator />
              <InfoRow icon={Globe} label="Vertical" value={vendor.verticalType || "Not set"} muted={!vendor.verticalType} />
              <Separator />
              <InfoRow icon={Mail} label="Email" value={vendor.email} />
              <Separator />
              <InfoRow icon={Phone} label="Phone" value={vendor.phone || "Not provided"} muted={!vendor.phone} />
              <Separator />
              <InfoRow icon={MapPin} label="Address" value={formatAddress(vendor.address)} muted={!vendor.address} />
              {vendor.registrationNumber && (
                <>
                  <Separator />
                  <InfoRow icon={Shield} label="Registration No." value={vendor.registrationNumber} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance & Metrics</CardTitle>
              <CardDescription>Listing and engagement stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{vendor.listingCount}</p>
                  <p className="text-xs text-muted-foreground">Total Listings</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{vendor.activeListingCount}</p>
                  <p className="text-xs text-muted-foreground">Active Listings</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <p className="text-2xl font-bold">{vendor.rating.toFixed(1)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating ({vendor.reviewCount} reviews)</p>
                </div>
                {vendor.totalRevenue !== undefined && (
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{formatCurrency(vendor.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                )}
              </div>
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
                    {formatFullDate(vendor.createdAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(vendor.createdAt)})
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
                    {formatFullDate(vendor.updatedAt)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({formatRelativeTime(vendor.updatedAt)})
                    </span>
                  </span>
                }
              />
              {vendor.lastActivityAt && (
                <>
                  <Separator />
                  <InfoRow
                    icon={RefreshCw}
                    label="Last Activity"
                    value={
                      <span>
                        {formatFullDate(vendor.lastActivityAt)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({formatRelativeTime(vendor.lastActivityAt)})
                        </span>
                      </span>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Vendor Listings */}
          <VendorListings vendorId={vendor.id} />
        </div>

        {/* Right — Status & Meta */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    vendor.status === "APPROVED"
                      ? "bg-emerald-500/10"
                      : vendor.status === "SUSPENDED" || vendor.status === "REJECTED"
                        ? "bg-destructive/10"
                        : "bg-muted"
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${
                      vendor.status === "APPROVED"
                        ? "text-emerald-600"
                        : vendor.status === "SUSPENDED" || vendor.status === "REJECTED"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <Badge variant={statusVariant as "default"} className="mb-1">
                    {vendor.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{statusDesc}</p>
                </div>
              </div>

              {vendor.rejectionReason && (
                <div className="rounded-md bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">Rejection Reason</p>
                  <p className="text-sm mt-1">{vendor.rejectionReason}</p>
                </div>
              )}

              {vendor.suspensionReason && (
                <div className="rounded-md bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">Suspension Reason</p>
                  <p className="text-sm mt-1">{vendor.suspensionReason}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                {vendor.status !== "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction("suspend")}
                  >
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Suspend Vendor
                  </Button>
                )}
                {vendor.status === "SUSPENDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setConfirmAction("reactivate")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivate Vendor
                  </Button>
                )}
                {vendor.status === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setConfirmAction("approve")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Vendor
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => setConfirmAction("reject")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Vendor
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {vendor.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{vendor.description}</p>
              </CardContent>
            </Card>
          )}

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {vendor.id}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partner ID</span>
                  <span className="font-mono text-muted-foreground truncate max-w-40">
                    {vendor.partnerId}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditVendorDialog open={editOpen} onOpenChange={setEditOpen} vendor={vendor} />

      {/* Confirmation Dialogs */}
      <ConfirmActionDialog
        open={confirmAction === "approve"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Approve Vendor"
        description={`Are you sure you want to approve "${vendor.name}"? They will be able to manage listings on the platform.`}
        confirmLabel="Approve"
        isPending={approveVendor.isPending}
        onConfirm={() => approveVendor.mutate(vendor.id, { onSuccess: () => setConfirmAction(null) })}
      />
      <ConfirmActionDialog
        open={confirmAction === "reject"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reject Vendor"
        description={`Are you sure you want to reject "${vendor.name}"? Please provide a reason.`}
        confirmLabel="Reject"
        confirmVariant="destructive"
        requiresReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="Enter reason for rejection..."
        isPending={rejectVendor.isPending}
        onConfirm={(reason) =>
          rejectVendor.mutate({ id: vendor.id, reason: reason! }, { onSuccess: () => setConfirmAction(null) })
        }
      />
      <ConfirmActionDialog
        open={confirmAction === "suspend"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Suspend Vendor"
        description={`Are you sure you want to suspend "${vendor.name}"? Their listings will become unavailable.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        requiresReason
        reasonLabel="Suspension Reason"
        reasonPlaceholder="Enter reason for suspension..."
        isPending={suspendVendor.isPending}
        onConfirm={(reason) =>
          suspendVendor.mutate({ id: vendor.id, reason: reason! }, { onSuccess: () => setConfirmAction(null) })
        }
      />
      <ConfirmActionDialog
        open={confirmAction === "reactivate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reactivate Vendor"
        description={`Are you sure you want to reactivate "${vendor.name}"? They will regain access to the platform.`}
        confirmLabel="Reactivate"
        isPending={reactivateVendor.isPending}
        onConfirm={() => reactivateVendor.mutate(vendor.id, { onSuccess: () => setConfirmAction(null) })}
      />
    </div>
  );
}
