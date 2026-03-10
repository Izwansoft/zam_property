"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, Store, UserCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";

export function PartnerEcosystemLandingContent() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const {
    data: partner,
    isLoading,
    error,
    refetch,
  } = usePartnerDetail(partnerId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PartnerDetailTabs partnerId={partnerId} />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading ecosystem data...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PartnerDetailTabs partnerId={partnerId} />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive text-sm">Failed to load ecosystem data.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => {
                void refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <PartnerDetailTabs partnerId={partnerId} />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Partner not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Vendors",
      description: "Supplier and owner-side vendor organizations",
      href: `/dashboard/platform/partners/${partnerId}/vendors`,
      icon: Store,
      metric: `${partner.vendorCount} total`,
    },
    {
      title: "Companies",
      description: "Brokerages and agency entities",
      href: `/dashboard/platform/partners/${partnerId}/companies`,
      icon: Building2,
      metric: "Browse companies",
    },
    {
      title: "Agents",
      description: "Sales and leasing agents under this partner",
      href: `/dashboard/platform/partners/${partnerId}/agents`,
      icon: UserCircle,
      metric: "Browse agents",
    },
  ];

  return (
    <div className="space-y-6">
      <PartnerDetailHeader partner={partner} basePath="/dashboard/platform/partners" />
      <PartnerDetailTabs partnerId={partnerId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <card.icon className="h-4 w-4" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{card.description}</p>
                <Badge variant="secondary">{card.metric}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
