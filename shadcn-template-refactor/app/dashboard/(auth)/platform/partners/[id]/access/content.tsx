"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { KeyRound, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";

const cards = [
  {
    title: "Users",
    description: "Review and manage all partner user accounts",
    hrefSuffix: "/users",
    icon: Users,
  },
  {
    title: "Access Configuration",
    description: "Review partner-level security and access settings",
    hrefSuffix: "/settings",
    icon: Shield,
  },
  {
    title: "Authentication & Identity",
    description: "Inspect identity and onboarding controls",
    hrefSuffix: "/settings",
    icon: KeyRound,
  },
];

export function PartnerAccessLandingContent() {
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
            Loading access data...
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
            <p className="text-destructive text-sm">Failed to load access data.</p>
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

  return (
    <div className="space-y-6">
      <PartnerDetailHeader partner={partner} basePath="/dashboard/platform/partners" />
      <PartnerDetailTabs partnerId={partnerId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={`/dashboard/platform/partners/${partnerId}${card.hrefSuffix}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <card.icon className="h-4 w-4" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{card.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
