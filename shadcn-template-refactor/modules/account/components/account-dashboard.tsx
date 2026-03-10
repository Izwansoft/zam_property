// =============================================================================
// AccountDashboard — Customer account dashboard with stats & quick actions
// =============================================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BookmarkIcon,
  MessageSquareIcon,
  StarIcon,
  EyeIcon,
  BellIcon,
  SearchIcon,
  UserIcon,
  ArrowRightIcon,
  ClockIcon,
  CalendarCheckIcon,
} from "lucide-react";
import { useDashboardStats, useRecentActivity } from "../hooks/use-dashboard-stats";
import { useVendorHub } from "../hooks/use-vendor-hub";
import { VendorHubCard } from "./vendor-hub-card";
import type { AccountDashboardStats, AccountActivity, AccountActivityType } from "../types";

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

function StatCard({ title, value, icon, href, description }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const quickActions = [
  {
    id: "search",
    label: "Search Listings",
    description: "Find your next property",
    href: "/search",
    icon: SearchIcon,
  },
  {
    id: "profile",
    label: "Edit Profile",
    description: "Update your personal info",
    href: "/dashboard/account/profile",
    icon: UserIcon,
  },
  {
    id: "inquiries",
    label: "View Inquiries",
    description: "Check your sent inquiries",
    href: "/dashboard/account/inquiries",
    icon: MessageSquareIcon,
  },
  {
    id: "bookings",
    label: "My Viewings",
    description: "Manage viewing appointments",
    href: "/dashboard/account/bookings",
    icon: CalendarCheckIcon,
  },
  {
    id: "saved",
    label: "Saved Listings",
    description: "View your favourites",
    href: "/dashboard/account/saved",
    icon: BookmarkIcon,
  },
];

// ---------------------------------------------------------------------------
// Activity Icon
// ---------------------------------------------------------------------------

function getActivityIcon(type: AccountActivityType) {
  switch (type) {
    case "INQUIRY_SENT":
    case "INQUIRY_REPLIED":
      return <MessageSquareIcon className="h-4 w-4" />;
    case "LISTING_SAVED":
    case "LISTING_UNSAVED":
      return <BookmarkIcon className="h-4 w-4" />;
    case "REVIEW_POSTED":
      return <StarIcon className="h-4 w-4" />;
    case "PROFILE_UPDATED":
      return <UserIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-MY", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Stats Grid
// ---------------------------------------------------------------------------

function StatsGrid({ stats }: { stats: AccountDashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Saved Listings"
        value={stats.savedListings}
        icon={<BookmarkIcon className="h-5 w-5" />}
        href="/dashboard/account/saved"
        description="Properties you've saved"
      />
      <StatCard
        title="My Inquiries"
        value={stats.totalInquiries}
        icon={<MessageSquareIcon className="h-5 w-5" />}
        href="/dashboard/account/inquiries"
        description={`${stats.activeInquiries} active`}
      />
      <StatCard
        title="My Viewings"
        value={stats.upcomingViewings}
        icon={<CalendarCheckIcon className="h-5 w-5" />}
        href="/dashboard/account/bookings"
        description="Upcoming appointments"
      />
      <StatCard
        title="Reviews Written"
        value={stats.reviewsWritten}
        icon={<StarIcon className="h-5 w-5" />}
        href="/dashboard/account/reviews"
      />
      <StatCard
        title="Notifications"
        value={stats.unreadNotifications}
        icon={<BellIcon className="h-5 w-5" />}
        href="/dashboard/account/notifications"
        description="Unread"
      />
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentActivityList({ activities }: { activities: AccountActivity[] }) {
  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No recent activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {getActivityIcon(activity.type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activity.description}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(activity.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-60" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AccountDashboard() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(5);
  const { items: vendorHubItems } = useVendorHub();

  const openOnboarding = (verticalKey: string) => {
    router.push(`/dashboard/account/vendor-onboarding?intent=vendor&vertical=${verticalKey}`);
  };

  const openVendorPortal = () => {
    router.push("/dashboard/vendor");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {statsLoading ? <StatsGridSkeleton /> : stats && <StatsGrid stats={stats} />}

      <VendorHubCard
        items={vendorHubItems}
        onStart={openOnboarding}
        onContinue={(verticalKey) => openOnboarding(verticalKey)}
        onViewSubmission={() => router.push("/dashboard/account?vendorApplication=submitted")}
        onOpenPortal={openVendorPortal}
        onResubmit={(verticalKey) => openOnboarding(verticalKey)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.id} href={action.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <RecentActivitySkeleton />
            ) : (
              <RecentActivityList activities={activities ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Skeleton
// ---------------------------------------------------------------------------

export function AccountDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsGridSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent>
            <RecentActivitySkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
