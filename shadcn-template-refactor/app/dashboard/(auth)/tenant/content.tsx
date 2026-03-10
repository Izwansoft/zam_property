"use client";

// =============================================================================
// Tenant Dashboard Content — Main dashboard page for tenants
// =============================================================================

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  ReceiptIcon,
  WrenchIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PageHeader } from "@/components/common/page-header";

// ---------------------------------------------------------------------------
// Quick Action Cards
// ---------------------------------------------------------------------------

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

function QuickActionCard({ title, description, href, icon: Icon }: QuickActionProps) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={href}>
            <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Stats Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Content
// ---------------------------------------------------------------------------

export function TenantDashboardContent() {
  const { user } = useAuth();

  const quickActions: QuickActionProps[] = [
    {
      title: "My Tenancy",
      description: "View your current tenancy details and lease information",
      href: "/dashboard/tenant/tenancy",
      icon: HomeIcon,
    },
    {
      title: "Bills & Payments",
      description: "View and pay your outstanding bills",
      href: "/dashboard/tenant/bills",
      icon: ReceiptIcon,
    },
    {
      title: "Maintenance",
      description: "Submit and track maintenance requests",
      href: "/dashboard/tenant/maintenance",
      icon: WrenchIcon,
    },
    {
      title: "Inspections",
      description: "View scheduled property inspections",
      href: "/dashboard/tenant/inspections",
      icon: ClipboardCheckIcon,
    },
    {
      title: "Documents",
      description: "Access your contracts and documents",
      href: "/dashboard/tenant/documents",
      icon: FileTextIcon,
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(" ")[0] ?? "Tenant"}`}
        description="Manage your tenancy, bills, and maintenance requests"
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Rent"
          value="—"
          description="Due on the 1st of each month"
        />
        <StatCard
          title="Outstanding Balance"
          value="—"
          description="Total amount due"
        />
        <StatCard
          title="Open Requests"
          value="—"
          description="Active maintenance requests"
        />
        <StatCard
          title="Next Inspection"
          value="—"
          description="Scheduled inspection date"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
