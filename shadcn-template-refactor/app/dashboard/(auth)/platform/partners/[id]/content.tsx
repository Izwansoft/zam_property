// =============================================================================
// Platform Partner Detail — Client content component (Overview tab)
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Building,
  CreditCard,
  StoreIcon,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import {
  PartnerDetailView,
  PartnerDetailHeader,
  PartnerDetailSkeleton,
} from "@/modules/partner/components/partner-detail";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";

// ---------------------------------------------------------------------------
// Quick Navigation Cards
// ---------------------------------------------------------------------------

function QuickNavCards({ partnerId, partner }: { partnerId: string; partner: { vendorCount: number; listingCount: number; activeListingCount: number } }) {
  const basePath = `/dashboard/platform/partners/${partnerId}`;

  const cards = [
    {
      label: "Access",
      href: `${basePath}/access`,
      icon: Users,
      color: "bg-violet-500/10 text-violet-600",
      value: null as string | null,
      description: "Manage users, roles, and access",
    },
    {
      label: "Ecosystem",
      href: `${basePath}/ecosystem`,
      icon: StoreIcon,
      color: "bg-emerald-500/10 text-emerald-600",
      value: `${partner.vendorCount} vendors`,
      description: "Vendors, companies, and agents",
    },
    {
      label: "Listings",
      href: `${basePath}/listings`,
      icon: Building,
      color: "bg-blue-500/10 text-blue-600",
      value: `${partner.listingCount} total · ${partner.activeListingCount} active`,
      description: "Browse all property listings",
    },
    {
      label: "Finance",
      href: `${basePath}/finance`,
      icon: CreditCard,
      color: "bg-amber-500/10 text-amber-600",
      value: null,
      description: "Partner subscription and billing oversight",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <Card className="group border-0 shadow-sm hover:shadow-md transition-all hover:border-primary/20 cursor-pointer">
            <CardContent className="flex items-start gap-3 pt-4 pb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} shrink-0`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{card.label}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {card.value && (
                  <p className="text-xs font-medium text-primary mt-0.5">{card.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformPartnerDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: partner, isLoading, error } = usePartnerDetail(params.id);

  if (isLoading) {
    return <PartnerDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load Partner
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Partner not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The Partner you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Header (above tabs) */}
      <PartnerDetailHeader
        partner={partner}
        basePath="/dashboard/platform/partners"
      />

      {/* Tabs navigation */}
      <PartnerDetailTabs partnerId={params.id} />

      {/* Quick navigation cards */}
      <QuickNavCards partnerId={params.id} partner={partner} />

      {/* Overview content (without header) */}
      <PartnerDetailView
        partner={partner}
        basePath="/dashboard/platform/partners"
        hideHeader
      />
    </div>
  );
}
