// =============================================================================
// Vendor Profile — Client content component
// =============================================================================
// Displays the current vendor's business profile with editable fields.
// Uses mock data until backend integration in Phase 4.
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  FileText,
  CalendarDays,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock vendor profile — will be replaced with useVendor(currentUser.primaryVendorId)
// ---------------------------------------------------------------------------

const MOCK_PROFILE = {
  id: "vendor-001",
  name: "Skyline Realty Sdn Bhd",
  type: "AGENCY" as const,
  email: "info@skylinerealty.com.my",
  phone: "+60 3-1234 5678",
  description:
    "Leading property agency in Kuala Lumpur specializing in residential and commercial properties. Trusted by thousands of homebuyers since 2015.",
  registrationNumber: "SSM-12345678-W",
  status: "APPROVED" as const,
  logo: null,
  address: {
    line1: "Level 10, Tower A, Menara XYZ",
    line2: "Jalan Sultan Ismail",
    city: "Kuala Lumpur",
    state: "WP Kuala Lumpur",
    postalCode: "50250",
    country: "Malaysia",
  },
  listingCount: 48,
  activeListingCount: 32,
  rating: 4.6,
  reviewCount: 127,
  createdAt: "2024-03-15T08:00:00Z",
  updatedAt: "2026-01-28T14:32:00Z",
};

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorProfileContent() {
  const profile = MOCK_PROFILE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Profile"
        description="View and manage your vendor information."
        actions={[
          {
            label: "Edit Profile",
            icon: Pencil,
            onClick: () => {},
            disabled: true,
          },
        ]}
      />

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <CardDescription className="mt-1">
                {profile.type} · {profile.registrationNumber}
              </CardDescription>
            </div>
            <Badge variant={STATUS_VARIANT[profile.status] ?? "outline"}>
              {profile.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {profile.description}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          label="Total Listings"
          value={profile.listingCount}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          label="Active Listings"
          value={profile.activeListingCount}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-amber-500" />}
          label="Rating"
          value={`${profile.rating} / 5`}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-muted-foreground" />}
          label="Reviews"
          value={profile.reviewCount}
        />
      </div>

      {/* Contact & Address */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone} />
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Member since"
              value={new Date(profile.createdAt).toLocaleDateString("en-MY", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm leading-relaxed">
                <p>{profile.address.line1}</p>
                {profile.address.line2 && <p>{profile.address.line2}</p>}
                <p>
                  {profile.address.postalCode} {profile.address.city}
                </p>
                <p>
                  {profile.address.state}, {profile.address.country}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{String(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
