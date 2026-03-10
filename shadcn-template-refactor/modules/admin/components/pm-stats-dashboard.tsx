// =============================================================================
// PMStatsDashboard — Platform-wide PM aggregate stats overview
// =============================================================================
// Displays 10 sections of PM stats from GET /admin/dashboard/pm-stats.
// Used on platform admin PM pages. Renders metric cards in a grid with
// section grouping for tenancy, billing, maintenance, payouts, etc.
// =============================================================================

"use client";

import {
  HomeIcon,
  ReceiptIcon,
  WrenchIcon,
  CreditCardIcon,
  ShieldIcon,
  ClipboardCheckIcon,
  ScaleIcon,
  UsersIcon,
  Building2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AdminPMStats, StatusCountDto } from "../types/admin-pm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PMStatsDashboardProps {
  /** PM stats data from useAdminPMStats */
  stats: AdminPMStats | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Show only specific sections (default: all) */
  sections?: PMStatSection[];
  /** Additional className */
  className?: string;
}

export type PMStatSection =
  | "tenancy"
  | "billing"
  | "maintenance"
  | "payout"
  | "deposit"
  | "inspection"
  | "claim"
  | "legal"
  | "tenant"
  | "companyAgent";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "RM 0.00";
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-MY").format(value);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatValue({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "warning" | "destructive" | "success";
}) {
  const colorMap = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    destructive: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400",
  };

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("text-xl font-bold", colorMap[variant])}>
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}

function StatusBreakdown({ items }: { items: StatusCountDto[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {items.map((item) => (
        <Badge key={item.status} variant="outline" className="text-xs">
          {item.status.replace(/_/g, " ").toLowerCase()}: {item.count}
        </Badge>
      ))}
    </div>
  );
}

function StatSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section Configs
// ---------------------------------------------------------------------------

interface SectionConfig {
  key: PMStatSection;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    key: "tenancy",
    title: "Tenancies",
    description: "Cross-partner tenancy overview",
    icon: HomeIcon,
  },
  {
    key: "billing",
    title: "Billing",
    description: "Revenue collection status",
    icon: ReceiptIcon,
  },
  {
    key: "maintenance",
    title: "Maintenance",
    description: "Work order overview",
    icon: WrenchIcon,
  },
  {
    key: "payout",
    title: "Payouts",
    description: "Owner payout processing",
    icon: CreditCardIcon,
  },
  {
    key: "deposit",
    title: "Deposits",
    description: "Security deposit management",
    icon: ShieldIcon,
  },
  {
    key: "inspection",
    title: "Inspections",
    description: "Property inspection tracking",
    icon: ClipboardCheckIcon,
  },
  {
    key: "claim",
    title: "Claims",
    description: "Damage claim processing",
    icon: AlertTriangleIcon,
  },
  {
    key: "legal",
    title: "Legal Cases",
    description: "Legal case management",
    icon: ScaleIcon,
  },
  {
    key: "tenant",
    title: "Tenants",
    description: "Partner occupancy",
    icon: UsersIcon,
  },
  {
    key: "companyAgent",
    title: "Companies & Agents",
    description: "Property management companies",
    icon: Building2Icon,
  },
];

// ---------------------------------------------------------------------------
// Section Renderers
// ---------------------------------------------------------------------------

function renderSectionContent(
  stats: AdminPMStats,
  section: PMStatSection
): React.ReactNode {
  switch (section) {
    case "tenancy":
      return (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatValue label="Total" value={stats.tenancy.totalCount} />
            <StatValue
              label="Active"
              value={stats.tenancy.activeCount}
              variant="success"
            />
            <StatValue
              label="Expiring Soon"
              value={stats.tenancy.expiringSoonCount}
              variant="warning"
            />
          </div>
          <StatusBreakdown items={stats.tenancy.byStatus} />
        </>
      );

    case "billing":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Billed This Month"
              value={formatCurrency(stats.billing.billedThisMonth)}
            />
            <StatValue
              label="Collected This Month"
              value={formatCurrency(stats.billing.collectedThisMonth)}
              variant="success"
            />
            <StatValue
              label="Overdue Amount"
              value={formatCurrency(stats.billing.overdueAmount)}
              variant="destructive"
            />
            <StatValue
              label="Overdue Count"
              value={stats.billing.overdueCount}
              variant="destructive"
            />
          </div>
          <StatusBreakdown items={stats.billing.byStatus} />
        </>
      );

    case "maintenance":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Open"
              value={stats.maintenance.openCount}
              variant="warning"
            />
            <StatValue
              label="Unassigned"
              value={stats.maintenance.unassignedCount}
              variant="destructive"
            />
          </div>
          <StatusBreakdown items={stats.maintenance.byStatus} />
          {stats.maintenance.byPriority.length > 0 && (
            <div className="pt-1">
              <p className="text-muted-foreground mb-1 text-xs">By Priority</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.maintenance.byPriority.map((item) => (
                  <Badge
                    key={item.status}
                    variant="outline"
                    className="text-xs"
                  >
                    {item.status.toLowerCase()}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      );

    case "payout":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Pending Approval"
              value={formatCurrency(stats.payout.pendingApprovalAmount)}
              variant="warning"
            />
            <StatValue
              label="Processed This Month"
              value={formatCurrency(stats.payout.processedThisMonth)}
              variant="success"
            />
          </div>
          <StatusBreakdown items={stats.payout.byStatus} />
        </>
      );

    case "deposit":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Total Held"
              value={formatCurrency(stats.deposit.totalHeldAmount)}
            />
            <StatValue
              label="Pending Refunds"
              value={stats.deposit.pendingRefundCount}
              variant="warning"
            />
          </div>
          <StatusBreakdown items={stats.deposit.byStatus} />
        </>
      );

    case "inspection":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Upcoming"
              value={stats.inspection.upcomingCount}
              variant="warning"
            />
            <StatValue
              label="Completed This Month"
              value={stats.inspection.completedThisMonth}
              variant="success"
            />
          </div>
          <StatusBreakdown items={stats.inspection.byStatus} />
        </>
      );

    case "claim":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Pending Review"
              value={stats.claim.pendingReviewCount}
              variant="warning"
            />
            <StatValue
              label="Disputed"
              value={stats.claim.disputedCount}
              variant="destructive"
            />
          </div>
          <StatusBreakdown items={stats.claim.byStatus} />
        </>
      );

    case "legal":
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatValue
              label="Open Cases"
              value={stats.legal.openCount}
              variant="warning"
            />
          </div>
          <StatusBreakdown items={stats.legal.byStatus} />
        </>
      );

    case "tenant":
      return (
        <div className="grid grid-cols-2 gap-4">
          <StatValue label="Total" value={stats.tenant.totalCount} />
          <StatValue
            label="Active"
            value={stats.tenant.activeCount}
            variant="success"
          />
        </div>
      );

    case "companyAgent":
      return (
        <div className="grid grid-cols-2 gap-4">
          <StatValue
            label="Companies"
            value={`${stats.companyAgent.activeCompanies} / ${stats.companyAgent.totalCompanies}`}
          />
          <StatValue
            label="Agents"
            value={`${stats.companyAgent.activeAgents} / ${stats.companyAgent.totalAgents}`}
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PMStatsDashboard({
  stats,
  isLoading = false,
  sections,
  className,
}: PMStatsDashboardProps) {
  const activeSections = sections
    ? SECTION_CONFIGS.filter((s) => sections.includes(s.key))
    : SECTION_CONFIGS;

  if (isLoading || !stats) {
    return (
      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}
      >
        {activeSections.map((section) => (
          <StatSectionSkeleton key={section.key} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Generated timestamp */}
      {stats.generatedAt && (
        <p className="text-muted-foreground text-xs">
          Stats generated at{" "}
          {new Date(stats.generatedAt).toLocaleString("en-MY")}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="text-muted-foreground h-4 w-4" />
                  <CardTitle className="text-sm font-medium">
                    {section.title}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderSectionContent(stats, section.key)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
