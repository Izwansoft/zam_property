"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  ActivityIcon,
  ArchiveRestoreIcon,
  BadgeDollarSignIcon,
  BrainCircuitIcon,
  BrainIcon,
  Building2Icon,
  CalendarIcon,
  ChartBarDecreasingIcon,
  ChartPieIcon,
  ChevronRight,
  ClipboardCheckIcon,
  ComponentIcon,
  CookieIcon,
  FingerprintIcon,
  FolderDotIcon,
  FolderIcon,
  GaugeIcon,
  GraduationCapIcon,
  ImagesIcon,
  KeyIcon,
  LayoutDashboardIcon,
  MailIcon,
  MessageSquareIcon,
  MessageSquareHeartIcon,
  PuzzleIcon,
  RedoDotIcon,
  SettingsIcon,
  ShoppingBagIcon,
  SquareCheckIcon,
  SquareKanbanIcon,
  StickyNoteIcon,
  UserIcon,
  UsersIcon,
  WalletMinimalIcon,
  CreditCardIcon,
  BrushCleaningIcon,
} from "lucide-react";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  detectPortal,
  getPortalNavConfig,
  isNavItemActive,
  type NavGroup,
  type NavItem,
} from "@/config/navigation";

// ===========================================
// REFERENCE EXAMPLES - Pre-built templates (dev only)
// ===========================================
const referenceItems: NavGroup[] = [
  {
    title: "Dashboard Examples",
    items: [
      {
        title: "Classic Dashboard",
        href: "/dashboard/reference/default",
        icon: ChartPieIcon
      },
      {
        title: "E-commerce",
        href: "#",
        icon: ShoppingBagIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/reference/ecommerce" },
          { title: "Product List", href: "/dashboard/reference/pages/products" },
          { title: "Product Detail", href: "/dashboard/reference/pages/products/1" },
          { title: "Add Product", href: "/dashboard/reference/pages/products/create" },
          { title: "Order List", href: "/dashboard/reference/pages/orders" },
          { title: "Order Detail", href: "/dashboard/reference/pages/orders/detail" }
        ]
      },
      {
        title: "Payment Dashboard",
        href: "/dashboard/reference/payment",
        icon: CreditCardIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/reference/payment" },
          { title: "Transactions", href: "/dashboard/reference/payment/transactions" }
        ]
      },
      {
        title: "Hotel Dashboard",
        href: "/dashboard/reference/hotel",
        icon: Building2Icon,
        items: [
          { title: "Dashboard", href: "/dashboard/reference/hotel" },
          { title: "Bookings", href: "/dashboard/reference/hotel/bookings" }
        ]
      },
      {
        title: "Project Management",
        href: "/dashboard/reference/project-management",
        icon: FolderDotIcon,
        items: [
          { title: "Dashboard", href: "/dashboard/reference/project-management" },
          { title: "Project List", href: "/dashboard/reference/project-list" }
        ]
      },
      { title: "Sales", href: "/dashboard/reference/sales", icon: BadgeDollarSignIcon },
      { title: "CRM", href: "/dashboard/reference/crm", icon: ChartBarDecreasingIcon },
      { title: "Website Analytics", href: "/dashboard/reference/website-analytics", icon: GaugeIcon },
      { title: "File Manager", href: "/dashboard/reference/file-manager", icon: FolderIcon },
      { title: "Crypto", href: "/dashboard/reference/crypto", icon: WalletMinimalIcon },
      { title: "Academy/School", href: "/dashboard/reference/academy", icon: GraduationCapIcon },
      { title: "Hospital Management", href: "/dashboard/reference/hospital-management", icon: ActivityIcon },
      { title: "Finance Dashboard", href: "/dashboard/reference/finance", icon: WalletMinimalIcon }
    ]
  },
  {
    title: "App Examples",
    items: [
      { title: "Kanban", href: "/dashboard/reference/apps/kanban", icon: SquareKanbanIcon },
      { title: "Notes", href: "/dashboard/reference/apps/notes", icon: StickyNoteIcon },
      { title: "Chats", href: "/dashboard/reference/apps/chat", icon: MessageSquareIcon },
      { title: "Social Media", href: "/dashboard/reference/apps/social-media", icon: MessageSquareHeartIcon },
      { title: "Mail", href: "/dashboard/reference/apps/mail", icon: MailIcon },
      { title: "Todo List App", href: "/dashboard/reference/apps/todo-list-app", icon: SquareCheckIcon },
      { title: "Tasks", href: "/dashboard/reference/apps/tasks", icon: ClipboardCheckIcon },
      { title: "Calendar", href: "/dashboard/reference/apps/calendar", icon: CalendarIcon },
      { title: "File Manager App", href: "/dashboard/reference/apps/file-manager", icon: ArchiveRestoreIcon },
      { title: "Api Keys", href: "/dashboard/reference/apps/api-keys", icon: KeyIcon },
      { title: "POS App", href: "/dashboard/reference/apps/pos-system", icon: CookieIcon }
    ]
  },
  {
    title: "AI App Examples",
    items: [
      { title: "AI Chat", href: "/dashboard/reference/apps/ai-chat", icon: BrainIcon },
      { title: "AI Chat V2", href: "/dashboard/reference/apps/ai-chat-v2", icon: BrainCircuitIcon },
      { title: "Image Generator", href: "/dashboard/reference/apps/ai-image-generator", icon: ImagesIcon }
    ]
  },
  {
    title: "Page Examples",
    items: [
      { title: "Users List", href: "/dashboard/reference/pages/users", icon: UsersIcon },
      { title: "Profile", href: "/dashboard/reference/pages/profile", icon: UserIcon },
      { title: "Profile V2", href: "/dashboard/reference/pages/user-profile", icon: UserIcon },
      { title: "Onboarding Flow", href: "/dashboard/reference/pages/onboarding-flow", icon: RedoDotIcon },
      {
        title: "Empty States",
        href: "/dashboard/reference/pages/empty-states/01",
        icon: BrushCleaningIcon,
        items: [
          { title: "Empty States 01", href: "/dashboard/reference/pages/empty-states/01" },
          { title: "Empty States 02", href: "/dashboard/reference/pages/empty-states/02" },
          { title: "Empty States 03", href: "/dashboard/reference/pages/empty-states/03" }
        ]
      },
      {
        title: "Pricing",
        href: "#",
        icon: BadgeDollarSignIcon,
        items: [
          { title: "Column Pricing", href: "/dashboard/reference/pages/pricing/column" },
          { title: "Table Pricing", href: "/dashboard/reference/pages/pricing/table" },
          { title: "Single Pricing", href: "/dashboard/reference/pages/pricing/single" }
        ]
      },
      {
        title: "Authentication",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "Login v1", href: "/dashboard/login/v1" },
          { title: "Login v2", href: "/dashboard/login/v2" },
          { title: "Register v1", href: "/dashboard/register/v1" },
          { title: "Register v2", href: "/dashboard/register/v2" },
          { title: "Forgot Password", href: "/dashboard/forgot-password" }
        ]
      },
      {
        title: "Error Pages",
        href: "/",
        icon: FingerprintIcon,
        items: [
          { title: "404", href: "/dashboard/reference/pages/error/404" },
          { title: "500", href: "/dashboard/reference/pages/error/500" },
          { title: "403", href: "/dashboard/reference/pages/error/403" }
        ]
      }
    ]
  },
  {
    title: "Widget Examples",
    items: [
      {
        title: "Widgets",
        href: "#",
        icon: PuzzleIcon,
        items: [
          { title: "Fitness", href: "/dashboard/reference/widgets/fitness" },
          { title: "E-commerce", href: "/dashboard/reference/widgets/ecommerce" },
          { title: "Analytics", href: "/dashboard/reference/widgets/analytics" }
        ]
      },
      {
        title: "Components Docs",
        href: "https://ui.shadcn.com/docs/components",
        icon: ComponentIcon,
        newTab: true
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// NavSection â€” renders a list of NavGroups into sidebar groups
// ---------------------------------------------------------------------------
interface NavSectionProps {
  items: NavGroup[];
}

function NavSection({ items }: NavSectionProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  // Check if a submenu should be open based on current path
  const isSubmenuActive = (subItems: NavItem[]) => {
    return subItems.some((s) =>
      pathname === s.href || pathname.startsWith(s.href + "/")
    );
  };

  return (
    <>
      {items.map((nav) => (
        <SidebarGroup key={nav.title}>
          <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {Array.isArray(item.items) && item.items.length > 0 ? (
                    <>
                      <div className="hidden group-data-[collapsible=icon]:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                            className="min-w-48 rounded-lg">
                            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                            {item.items?.map((subItem) => (
                              <DropdownMenuItem
                                className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10! active:bg-(--primary)/10!"
                                asChild
                                key={subItem.title}>
                                <Link href={subItem.href} target={subItem.newTab ? "_blank" : undefined}>
                                  {subItem.title}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Collapsible
                        suppressHydrationWarning
                        className="group/collapsible block group-data-[collapsible=icon]:hidden"
                        defaultOpen={isSubmenuActive(item.items)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
                            tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item?.items?.map((subItem, key) => (
                              <SidebarMenuSubItem key={key}>
                                <SidebarMenuSubButton
                                  className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
                                  isActive={isNavItemActive(pathname, subItem)}
                                  asChild>
                                  <Link href={subItem.href} target={subItem.newTab ? "_blank" : ""}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  ) : (
                    <SidebarMenuButton
                      className="hover:text-foreground active:text-foreground hover:bg-(--primary)/10 active:bg-(--primary)/10"
                      isActive={isNavItemActive(pathname, item)}
                      tooltip={item.title}
                      asChild>
                      <Link href={item.href} target={item.newTab ? "_blank" : ""}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  {!!item.isComing && (
                    <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                      Coming
                    </SidebarMenuBadge>
                  )}
                  {!!item.badge && (
                    <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// NavMain â€” Portal-aware main navigation (Session 1.7)
// ---------------------------------------------------------------------------
export function NavMain() {
  const pathname = usePathname();
  const portal = detectPortal(pathname);

  // Get portal-specific nav or fallback to empty
  const portalConfig = portal ? getPortalNavConfig(portal) : null;

  return (
    <>
      {/* Portal Navigation â€” shows current portal's nav items */}
      {portalConfig && (
        <NavSection items={portalConfig.navGroups} />
      )}

      {/* Reference Examples - Collapsible (dev-only reference, hidden by default) */}
      <SidebarGroup>
        <Collapsible defaultOpen={false} className="group/reference">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full justify-start gap-2 font-medium text-primary hover:bg-primary/10">
              <LayoutDashboardIcon className="size-4" />
              <span>ðŸ“š Reference Examples</span>
              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/reference:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <NavSection items={referenceItems} />
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    </>
  );
}

