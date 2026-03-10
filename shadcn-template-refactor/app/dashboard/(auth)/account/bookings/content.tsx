// =============================================================================
// My Bookings — Customer's viewing appointments page
// =============================================================================
// Lists all BOOKING-type interactions (viewing scheduler appointments).
// Shows status, date/time, listing, and vendor details.
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingItem {
  id: string;
  referenceId: string;
  listingTitle: string;
  listingId: string;
  vendorName: string;
  status: "NEW" | "CONTACTED" | "CONFIRMED" | "CLOSED" | "INVALID";
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type BookingFilter = "all" | "upcoming" | "confirmed" | "past";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function generateMockBookings(): BookingItem[] {
  const now = Date.now();
  const day = 86_400_000;

  return [
    {
      id: "bk-001",
      referenceId: "VW-A1B2C3",
      listingTitle: "Semi-Detached House in Bangsar",
      listingId: "listing-001",
      vendorName: "Hartamas Real Estate",
      status: "CONFIRMED",
      scheduledDate: new Date(now + 3 * day).toISOString(),
      scheduledTime: "10:00 AM",
      createdAt: new Date(now - 2 * day).toISOString(),
      updatedAt: new Date(now - day).toISOString(),
    },
    {
      id: "bk-002",
      referenceId: "VW-D4E5F6",
      listingTitle: "Luxury Condo in Mont Kiara",
      listingId: "listing-002",
      vendorName: "PropNex Realty",
      status: "NEW",
      scheduledDate: new Date(now + 5 * day).toISOString(),
      scheduledTime: "2:00 PM",
      createdAt: new Date(now - day).toISOString(),
      updatedAt: new Date(now - day).toISOString(),
    },
    {
      id: "bk-003",
      referenceId: "VW-G7H8I9",
      listingTitle: "Terrace House in Petaling Jaya",
      listingId: "listing-003",
      vendorName: "ERA Malaysia",
      status: "CONFIRMED",
      scheduledDate: new Date(now + 7 * day).toISOString(),
      scheduledTime: "11:00 AM",
      notes: "Please bring IC for guardhouse entry",
      createdAt: new Date(now - 3 * day).toISOString(),
      updatedAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: "bk-004",
      referenceId: "VW-J1K2L3",
      listingTitle: "Penthouse at KLCC",
      listingId: "listing-004",
      vendorName: "IQI Global",
      status: "CLOSED",
      scheduledDate: new Date(now - 5 * day).toISOString(),
      scheduledTime: "3:00 PM",
      createdAt: new Date(now - 10 * day).toISOString(),
      updatedAt: new Date(now - 5 * day).toISOString(),
    },
    {
      id: "bk-005",
      referenceId: "VW-M4N5O6",
      listingTitle: "Bungalow in Shah Alam",
      listingId: "listing-005",
      vendorName: "Kith & Kin Realty",
      status: "INVALID",
      scheduledDate: new Date(now - 2 * day).toISOString(),
      scheduledTime: "9:00 AM",
      notes: "Cancelled by vendor — property sold",
      createdAt: new Date(now - 7 * day).toISOString(),
      updatedAt: new Date(now - 2 * day).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Status Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  BookingItem["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }
> = {
  NEW: { label: "Pending", variant: "secondary", icon: Clock },
  CONTACTED: { label: "In Progress", variant: "outline", icon: AlertCircle },
  CONFIRMED: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  CLOSED: { label: "Completed", variant: "outline", icon: CheckCircle2 },
  INVALID: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

function formatBookingDate(iso?: string): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Booking Card
// ---------------------------------------------------------------------------

function BookingCard({ booking }: { booking: BookingItem }) {
  const config = STATUS_CONFIG[booking.status];
  const StatusIcon = config.icon;
  const isUpcoming =
    booking.scheduledDate && new Date(booking.scheduledDate) > new Date();

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/30",
        isUpcoming && booking.status === "CONFIRMED" && "border-primary/30",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Info */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={config.variant} className="text-xs">
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {booking.referenceId}
              </span>
            </div>

            <Link
              href={`/listings/${booking.listingId}`}
              className="block text-sm font-medium hover:underline truncate"
            >
              {booking.listingTitle}
            </Link>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatBookingDate(booking.scheduledDate)}
              </span>
              {booking.scheduledTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {booking.scheduledTime}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {booking.vendorName}
              </span>
            </div>

            {booking.notes && (
              <p className="text-xs text-muted-foreground italic">
                {booking.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BookingsContent() {
  const [filter, setFilter] = useState<BookingFilter>("all");
  // Mock data — in production this would use a query hook
  const [isLoading] = useState(false);
  const bookings = useMemo(() => generateMockBookings(), []);

  const filtered = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case "upcoming":
        return bookings.filter(
          (b) =>
            b.scheduledDate &&
            new Date(b.scheduledDate) > now &&
            b.status !== "INVALID" &&
            b.status !== "CLOSED",
        );
      case "confirmed":
        return bookings.filter((b) => b.status === "CONFIRMED");
      case "past":
        return bookings.filter(
          (b) =>
            !b.scheduledDate ||
            new Date(b.scheduledDate) <= now ||
            b.status === "CLOSED" ||
            b.status === "INVALID",
        );
      default:
        return bookings;
    }
  }, [bookings, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Viewings"
        description="Manage your property viewing appointments."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "bookings", label: "My Viewings" },
        ]}
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as BookingFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Viewings</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {filtered.length} viewing{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "No viewing appointments yet."
                : `No ${filter} viewings.`}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search">Browse Listings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

