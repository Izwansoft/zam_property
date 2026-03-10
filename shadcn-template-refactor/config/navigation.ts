// =============================================================================
// Navigation Config — Portal-scoped navigation trees (Part-5 §5.3)
// =============================================================================
// Single source of truth for all portal navigation.
// Each portal has its own nav tree. Items are filtered by current portal.
// =============================================================================

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  Building2Icon,
  UsersIcon,
  ShoppingBagIcon,
  MessageSquareIcon,
  StarIcon,
  ChartPieIcon,
  SettingsIcon,
  FlagIcon,
  ScrollTextIcon,
  WrenchIcon,
  BadgeDollarSignIcon,
  FlaskConicalIcon,
  UserIcon,
  BookmarkIcon,
  BellIcon,
  ShieldIcon,
  InboxIcon,
  StoreIcon,
  CalendarCheckIcon,
  MessageCircleIcon,
  HomeIcon,
  ReceiptIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  LinkIcon,
  TrendingUpIcon,
  ScaleIcon,
  SearchIcon,
  RocketIcon,
  HardHatIcon,
  ShieldAlertIcon,
  ListIcon,
  BanknoteIcon,
  LayersIcon,
  ArrowLeftRightIcon,
} from "lucide-react";

import type { Portal } from "@/modules/auth/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  /** Display label */
  title: string;
  /** Route path (relative to portal root, auto-prefixed) */
  href: string;
  /** Lucide icon component */
  icon?: LucideIcon;
  /** Badge text (e.g., "New", count) */
  badge?: string;
  /** Whether this is a coming-soon item */
  isComing?: boolean;
  /** Child items for collapsible sub-menus */
  items?: NavItem[];
  /** Open link in new tab */
  newTab?: boolean;
  /** If true, marks exact path match only for active state */
  exactMatch?: boolean;
}

export interface NavGroup {
  /** Section label shown as sidebar group header */
  title: string;
  /** Navigation items in this group */
  items: NavItem[];
}

export interface PortalConfig {
  /** Portal identifier */
  portal: Portal;
  /** Portal display name for sidebar header */
  label: string;
  /** Short description */
  description: string;
  /** Navigation groups */
  navGroups: NavGroup[];
}

// ---------------------------------------------------------------------------
// Platform Admin Navigation (SUPER_ADMIN)
// ---------------------------------------------------------------------------

const platformNav: PortalConfig = {
  portal: "platform",
  label: "Platform Admin",
  description: "System administration",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/platform",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Partners",
      items: [
        {
          title: "Partners",
          href: "/dashboard/platform/partners",
          icon: Building2Icon,
        },
      ],
    },
    {
      title: "Access",
      items: [
        {
          title: "All Users",
          href: "/dashboard/platform/users",
          icon: UsersIcon,
        },
        {
          title: "Platform Team",
          href: "/dashboard/platform/team",
          icon: ShieldIcon,
        },
      ],
    },
    {
      title: "Ecosystem",
      items: [
        {
          title: "Marketplace Types",
          href: "/dashboard/platform/verticals",
          icon: LayersIcon,
        },
        {
          title: "Vendors",
          href: "/dashboard/platform/vendors",
          icon: StoreIcon,
        },
        {
          title: "Companies",
          href: "/dashboard/platform/companies",
          icon: Building2Icon,
        },
        {
          title: "Agents",
          href: "/dashboard/platform/agents",
          icon: UsersIcon,
        },
      ],
    },
    {
      title: "Listings",
      items: [
        {
          title: "Listings",
          href: "/dashboard/platform/listings",
          icon: ShoppingBagIcon,
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          title: "Partner Billing",
          href: "/dashboard/platform/billing",
          icon: ReceiptIcon,
        },
        {
          title: "Subscriptions",
          href: "/dashboard/platform/subscriptions",
          icon: CreditCardIcon,
        },
        {
          title: "Plans & Pricing",
          href: "/dashboard/platform/pricing",
          icon: BadgeDollarSignIcon,
        },
      ],
    },
    {
      title: "Governance",
      items: [
        {
          title: "Audit Logs",
          href: "/dashboard/platform/audit",
          icon: ScrollTextIcon,
        },
        {
          title: "Job Queue",
          href: "/dashboard/platform/jobs",
          icon: WrenchIcon,
        },
      ],
    },
    {
      title: "Platform Settings",
      items: [
        {
          title: "Feature Flags",
          href: "/dashboard/platform/feature-flags",
          icon: FlagIcon,
        },
        {
          title: "Experiments",
          href: "/dashboard/platform/experiments",
          icon: FlaskConicalIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/platform/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Partner Admin Navigation (PARTNER_ADMIN, SUPER_ADMIN)
// ---------------------------------------------------------------------------

const partnerNav: PortalConfig = {
  portal: "partner",
  label: "Partner Admin",
  description: "Partner management",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/partner",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Vendors",
          href: "/dashboard/partner/vendors",
          icon: UsersIcon,
        },
        {
          title: "Listings",
          href: "/dashboard/partner/listings",
          icon: ShoppingBagIcon,
        },
        {
          title: "Approval Queue",
          href: "/dashboard/partner/listings/approvals",
          icon: ClipboardCheckIcon,
        },
        {
          title: "Reviews",
          href: "/dashboard/partner/reviews",
          icon: StarIcon,
        },
        {
          title: "Users",
          href: "/dashboard/partner/users",
          icon: UserIcon,
        },
        {
          title: "Marketplace Types",
          href: "/dashboard/partner/verticals",
          icon: LayersIcon,
        },
      ],
    },
    {
      title: "Billing",
      items: [
        {
          title: "Subscription & Usage",
          href: "/dashboard/partner/subscription",
          icon: CreditCardIcon,
        },
      ],
    },
    {
      title: "Compliance",
      items: [
        {
          title: "Audit Logs",
          href: "/dashboard/partner/audit",
          icon: ScrollTextIcon,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "General Settings",
          href: "/dashboard/partner/settings",
          icon: SettingsIcon,
        },
        {
          title: "Notification Preferences",
          href: "/dashboard/partner/settings/notifications",
          icon: BellIcon,
        },
      ],
    },
    {
      title: "Insights",
      items: [
        {
          title: "Analytics",
          href: "/dashboard/partner/analytics",
          icon: ChartPieIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Vendor Navigation (VENDOR_ADMIN, VENDOR_STAFF)
// ---------------------------------------------------------------------------

const vendorNav: PortalConfig = {
  portal: "vendor",
  label: "Vendor Portal",
  description: "Manage your business",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/vendor",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
        {
          title: "Onboarding",
          href: "/dashboard/vendor/onboarding",
          icon: RocketIcon,
        },
      ],
    },
    {
      title: "Properties",
      items: [
        {
          title: "Listings",
          href: "/dashboard/vendor/listings",
          icon: ShoppingBagIcon,
        },
        {
          title: "Tenancies",
          href: "/dashboard/vendor/tenancies",
          icon: Building2Icon,
        },
        {
          title: "Maintenance",
          href: "/dashboard/vendor/maintenance",
          icon: WrenchIcon,
        },
        {
          title: "Inspections",
          href: "/dashboard/vendor/inspections",
          icon: ClipboardCheckIcon,
        },
        {
          title: "Claims",
          href: "/dashboard/vendor/claims",
          icon: ShieldAlertIcon,
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          title: "Inbox",
          href: "/dashboard/vendor/inbox",
          icon: InboxIcon,
        },
        {
          title: "Reviews",
          href: "/dashboard/vendor/reviews",
          icon: StarIcon,
        },
        {
          title: "Legal Cases",
          href: "/dashboard/vendor/legal",
          icon: ScaleIcon,
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          title: "Billing",
          href: "/dashboard/vendor/billing",
          icon: ReceiptIcon,
        },
        {
          title: "Payouts",
          href: "/dashboard/vendor/payouts",
          icon: CreditCardIcon,
        },
      ],
    },
    {
      title: "Insights",
      items: [
        {
          title: "Analytics",
          href: "/dashboard/vendor/analytics",
          icon: ChartBarIcon,
          isComing: true,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Subscription",
          href: "/dashboard/vendor/subscription",
          icon: BadgeDollarSignIcon,
        },
        {
          title: "Profile",
          href: "/dashboard/vendor/profile",
          icon: StoreIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/vendor/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Customer Account Navigation (CUSTOMER, any authenticated)
// ---------------------------------------------------------------------------

const accountNav: PortalConfig = {
  portal: "account",
  label: "My Account",
  description: "Your personal dashboard",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/account",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Activity",
      items: [
        {
          title: "My Inquiries",
          href: "/dashboard/account/inquiries",
          icon: MessageSquareIcon,
        },
        {
          title: "Messages",
          href: "/dashboard/account/messages",
          icon: MessageCircleIcon,
        },
        {
          title: "My Viewings",
          href: "/dashboard/account/bookings",
          icon: CalendarCheckIcon,
        },
        {
          title: "Saved Listings",
          href: "/dashboard/account/saved",
          icon: BookmarkIcon,
        },
        {
          title: "Saved Searches",
          href: "/dashboard/account/saved-searches",
          icon: SearchIcon,
        },
        {
          title: "My Reviews",
          href: "/dashboard/account/reviews",
          icon: StarIcon,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Profile",
          href: "/dashboard/account/profile",
          icon: UserIcon,
        },
        {
          title: "Notifications",
          href: "/dashboard/account/notifications",
          icon: BellIcon,
        },
        {
          title: "Security",
          href: "/dashboard/account/security",
          icon: ShieldIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/account/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Tenant Navigation (TENANT)
// ---------------------------------------------------------------------------

const tenantNav: PortalConfig = {
  portal: "tenant",
  label: "Tenant Portal",
  description: "Manage your tenancy",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/tenant",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
        {
          title: "Onboarding",
          href: "/dashboard/tenant/onboarding",
          icon: RocketIcon,
        },
      ],
    },
    {
      title: "Tenancy",
      items: [
        {
          title: "My Tenancy",
          href: "/dashboard/tenant/tenancy",
          icon: HomeIcon,
        },
        {
          title: "Bills & Payments",
          href: "/dashboard/tenant/bills",
          icon: ReceiptIcon,
        },
        {
          title: "Maintenance",
          href: "/dashboard/tenant/maintenance",
          icon: WrenchIcon,
        },
        {
          title: "Inspections",
          href: "/dashboard/tenant/inspections",
          icon: ClipboardCheckIcon,
        },
        {
          title: "Documents",
          href: "/dashboard/tenant/documents",
          icon: FileTextIcon,
        },
        {
          title: "Claims",
          href: "/dashboard/tenant/claims",
          icon: ShieldAlertIcon,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          href: "/dashboard/tenant/profile",
          icon: UserIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/tenant/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Company Admin Navigation (COMPANY_ADMIN)
// ---------------------------------------------------------------------------

const companyNav: PortalConfig = {
  portal: "company",
  label: "Company Portal",
  description: "Manage your company",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/company",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Agents",
          href: "/dashboard/company/agents",
          icon: UsersIcon,
        },
        {
          title: "Listings",
          href: "/dashboard/company/listings",
          icon: ShoppingBagIcon,
        },
        {
          title: "Tenancies",
          href: "/dashboard/company/tenancies",
          icon: Building2Icon,
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          title: "Billing",
          href: "/dashboard/company/billing",
          icon: ReceiptIcon,
        },
        {
          title: "Commissions",
          href: "/dashboard/company/commissions",
          icon: BadgeDollarSignIcon,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Company Profile",
          href: "/dashboard/company/profile",
          icon: StoreIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/company/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Agent Navigation (AGENT)
// ---------------------------------------------------------------------------

const agentNav: PortalConfig = {
  portal: "agent",
  label: "Agent Portal",
  description: "Manage your listings and commissions",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/agent",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Work",
      items: [
        {
          title: "My Listings",
          href: "/dashboard/agent/listings",
          icon: ShoppingBagIcon,
        },
        {
          title: "My Tenancies",
          href: "/dashboard/agent/tenancies",
          icon: Building2Icon,
        },
      ],
    },
    {
      title: "Earnings",
      items: [
        {
          title: "Commissions",
          href: "/dashboard/agent/commissions",
          icon: BadgeDollarSignIcon,
        },
        {
          title: "Performance",
          href: "/dashboard/agent/performance",
          icon: TrendingUpIcon,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Referrals",
          href: "/dashboard/agent/referrals",
          icon: LinkIcon,
        },
        {
          title: "Profile",
          href: "/dashboard/agent/profile",
          icon: UserIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/agent/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Affiliate Portal — referral tracking, earnings, payouts
// ---------------------------------------------------------------------------

const affiliateNav: PortalConfig = {
  portal: "affiliate",
  label: "Affiliate Portal",
  description: "Track referrals and manage your affiliate earnings",
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/affiliate",
          icon: LayoutDashboardIcon,
          exactMatch: true,
        },
      ],
    },
    {
      title: "Activity",
      items: [
        {
          title: "Referrals",
          href: "/dashboard/affiliate/referrals",
          icon: LinkIcon,
        },
      ],
    },
    {
      title: "Earnings",
      items: [
        {
          title: "Payouts",
          href: "/dashboard/affiliate/payouts",
          icon: BadgeDollarSignIcon,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          href: "/dashboard/affiliate/profile",
          icon: UserIcon,
        },
        {
          title: "Settings",
          href: "/dashboard/affiliate/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Portal registry — maps portal → config
// ---------------------------------------------------------------------------

export const PORTAL_NAV_CONFIG: Record<Portal, PortalConfig> = {
  platform: platformNav,
  partner: partnerNav,
  vendor: vendorNav,
  account: accountNav,
  tenant: tenantNav,
  company: companyNav,
  agent: agentNav,
  affiliate: affiliateNav,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect the current portal from a pathname.
 * Returns null if not in a recognized portal route.
 */
export function detectPortal(pathname: string): Portal | null {
  const match = pathname.match(/^\/dashboard\/(platform|partner|vendor|account|tenant|company|agent|affiliate)/);
  return (match?.[1] as Portal) ?? null;
}

/**
 * Get the navigation config for a specific portal.
 */
export function getPortalNavConfig(portal: Portal): PortalConfig {
  return PORTAL_NAV_CONFIG[portal];
}

/**
 * Collect all nav items (flat) for a portal — useful for search / command palette.
 */
export function getAllNavItems(portal: Portal): NavItem[] {
  const config = PORTAL_NAV_CONFIG[portal];
  const items: NavItem[] = [];

  for (const group of config.navGroups) {
    for (const item of group.items) {
      items.push(item);
      if (item.items) {
        items.push(...item.items);
      }
    }
  }

  return items;
}

/**
 * Check if a pathname is active for a specific nav item.
 * Uses exact match for items flagged as exactMatch, prefix match for parents.
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exactMatch) {
    return pathname === item.href;
  }
  // For items with children, check if pathname starts with any child href
  if (item.items && item.items.length > 0) {
    return item.items.some((child) => pathname.startsWith(child.href));
  }
  // For leaf items, use starts-with to match nested routes (e.g., /listings/[id])
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/**
 * Check if any item in a group has an active sub-item — used for auto-expanding collapsibles.
 */
export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item));
}
