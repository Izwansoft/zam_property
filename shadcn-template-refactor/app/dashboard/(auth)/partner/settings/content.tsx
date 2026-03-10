"use client";

import Link from "next/link";
import {
  BellIcon,
  PaletteIcon,
  ShieldIcon,
  WorkflowIcon,
  CreditCardIcon,
  ScrollTextIcon,
  Settings2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotificationPreferences } from "@/modules/notification/hooks/use-notification-preferences";

export function PartnerSettingsContent() {
  const { data: notificationPrefs, isLoading: isLoadingPrefs } =
    useNotificationPreferences();

  const channelStats = (() => {
    const prefs = notificationPrefs?.preferences ?? [];
    const totals = {
      IN_APP: 0,
      EMAIL: 0,
      SMS: 0,
      PUSH: 0,
      WHATSAPP: 0,
    };

    for (const pref of prefs) {
      if (pref.channels.IN_APP) totals.IN_APP += 1;
      if (pref.channels.EMAIL) totals.EMAIL += 1;
      if (pref.channels.SMS) totals.SMS += 1;
      if (pref.channels.PUSH) totals.PUSH += 1;
      if (pref.channels.WHATSAPP) totals.WHATSAPP += 1;
    }

    return totals;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure partner-level controls, preferences, and upcoming integrations."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Notification Rules</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingPrefs ? "..." : notificationPrefs?.preferences?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Email Enabled</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingPrefs ? "..." : channelStats.EMAIL}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In-App Enabled</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingPrefs ? "..." : channelStats.IN_APP}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SMS Enabled</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingPrefs ? "..." : channelStats.SMS}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellIcon className="h-4 w-4 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which alerts your team receives by email and in-app channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/partner/settings/notifications">
                Manage Notifications
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCardIcon className="h-4 w-4 text-primary" />
              Billing Controls
            </CardTitle>
            <CardDescription>
              Manage plan entitlements and review current usage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/partner/subscription">Open Subscription</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PaletteIcon className="h-4 w-4 text-primary" />
              Branding
            </CardTitle>
            <CardDescription>
              Upload logos, set color accents, and define partner storefront identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Planned for next phase.</p>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WorkflowIcon className="h-4 w-4 text-primary" />
              Approval Workflow
            </CardTitle>
            <CardDescription>
              Define auto-publish rules and moderation checks for incoming listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Planned for next phase.</p>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollTextIcon className="h-4 w-4 text-primary" />
              Audit & Compliance
            </CardTitle>
            <CardDescription>
              Trace user and moderation changes for accountability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/partner/audit">Open Audit Logs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldIcon className="h-4 w-4 text-primary" />
              Access & Policy
            </CardTitle>
            <CardDescription>
              Review partner policy settings and future role-based team controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Planned for next phase.</p>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2Icon className="h-4 w-4 text-primary" />
              Portal Ops
            </CardTitle>
            <CardDescription>
              Partner operations shortcuts for day-to-day administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link className="block text-primary hover:underline" href="/dashboard/partner/users">
              Manage partner users
            </Link>
            <Link className="block text-primary hover:underline" href="/dashboard/partner/analytics">
              View partner analytics
            </Link>
            <Link className="block text-primary hover:underline" href="/dashboard/partner/listings/approvals">
              Open listing approvals
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
