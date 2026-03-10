"use client";

import * as React from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { detectPortal, getPortalNavConfig } from "@/config/navigation";
import { useDynamicBrand } from "@/modules/partner";
import { VerticalSwitcher } from "@/modules/vertical/components/vertical-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();

  // Detect current portal for sidebar header label
  const portal = detectPortal(pathname);
  const portalConfig = portal ? getPortalNavConfig(portal) : null;

  // Get dynamic branding (partner logos if set, otherwise defaults)
  const brand = useDynamicBrand();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname]);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:text-foreground h-12 group-data-[collapsible=icon]:px-0! hover:bg-(--primary)/5"
              asChild>
              <Link href={portalConfig ? `/dashboard/${portal}` : "/dashboard"}>
                {/* Brand icon â€” light */}
                <Image
                  src={brand.logo.iconLight}
                  width={brand.iconDimensions.width}
                  height={brand.iconDimensions.height}
                  className="me-1.5 rounded-md transition-all dark:hidden group-data-[collapsible=icon]:size-8"
                  alt={brand.logoAlt}
                />
                {/* Brand icon â€” dark */}
                <Image
                  src={brand.logo.iconDark}
                  width={brand.iconDimensions.width}
                  height={brand.iconDimensions.height}
                  className="me-1.5 hidden rounded-md transition-all dark:block group-data-[collapsible=icon]:size-8"
                  alt={brand.logoAlt}
                />
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate text-base font-bold">
                    {brand.name}
                  </span>
                  {portalConfig && (
                    <span className="text-muted-foreground truncate text-xs">
                      {portalConfig.label}
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Vertical Switcher â€” only visible in partner portal */}
        {portal === "partner" && (
          <div className="px-3 pt-2">
            <VerticalSwitcher />
          </div>
        )}
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

