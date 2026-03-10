// =============================================================================
// Partner Detail Tab Navigation — Shared across partner detail sub-pages
// =============================================================================
// URL-routed tabs for the partner detail drill-down view.
// Used in /platform/partners/[id], /[id]/users, /[id]/listings, etc.
// =============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2Icon,
  UsersIcon,
  ShoppingBagIcon,
  ArrowLeftRightIcon,
  SettingsIcon,
  StoreIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

interface PartnerTab {
  id: string;
  label: string;
  href: (partnerId: string) => string;
  icon: React.ComponentType<{ className?: string }>;
  /** Use exact pathname matching for this tab. */
  matchEnd?: boolean;
  /** Additional path prefixes that should activate this tab. */
  matchPrefixes?: string[];
}

const PARTNER_TABS: PartnerTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: (id) => `/dashboard/platform/partners/${id}`,
    icon: Building2Icon,
    matchEnd: true,
  },
  {
    id: "access",
    label: "Access",
    href: (id) => `/dashboard/platform/partners/${id}/access`,
    icon: UsersIcon,
    matchPrefixes: ["/users", "/access"],
  },
  {
    id: "ecosystem",
    label: "Ecosystem",
    href: (id) => `/dashboard/platform/partners/${id}/ecosystem`,
    icon: StoreIcon,
    matchPrefixes: ["/ecosystem", "/vendors", "/companies", "/agents"],
  },
  {
    id: "listings",
    label: "Listings",
    href: (id) => `/dashboard/platform/partners/${id}/listings`,
    icon: ShoppingBagIcon,
    matchPrefixes: ["/listings"],
  },
  {
    id: "finance",
    label: "Finance",
    href: (id) => `/dashboard/platform/partners/${id}/finance`,
    icon: ArrowLeftRightIcon,
    matchPrefixes: ["/finance"],
  },
  {
    id: "settings",
    label: "Settings",
    href: (id) => `/dashboard/platform/partners/${id}/settings`,
    icon: SettingsIcon,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PartnerDetailTabsProps {
  partnerId: string;
}

export function PartnerDetailTabs({ partnerId }: PartnerDetailTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-1 overflow-x-auto px-1" aria-label="Partner sections">
        {PARTNER_TABS.map((tab) => {
          const href = tab.href(partnerId);
          const defaultActive = tab.matchEnd ? pathname === href : pathname.startsWith(href);
          const isPrefixActive =
            !!tab.matchPrefixes &&
            tab.matchPrefixes.some((suffix) =>
              pathname.startsWith(`/dashboard/platform/partners/${partnerId}${suffix}`),
            );
          const isActive = defaultActive || isPrefixActive;

          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
