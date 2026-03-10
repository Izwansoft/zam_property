"use client";

import { BadgeCheck, Bell, LogOut, SettingsIcon, ShieldIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import * as React from "react";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { roleToPortal } from "@/modules/auth/types";
import { Badge } from "@/components/ui/badge";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Role display labels */
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Platform Admin",
  PARTNER_ADMIN: "Partner Admin",
  VENDOR_ADMIN: "Vendor Admin",
  VENDOR_STAFF: "Vendor Staff",
  CUSTOMER: "Customer",
  GUEST: "Guest",
};

export default function UserMenu() {
  const { user, logout, isAuthenticated } = useAuth();

  const displayName = user?.fullName ?? "Guest";
  const displayEmail = user?.email ?? "";
  const initials = user ? getInitials(user.fullName) : "?";
  const portal = user ? roleToPortal(user.role) : "account";
  const roleLabel = user ? ROLE_LABELS[user.role] ?? user.role : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus-visible:ring-ring rounded-full focus-visible:outline-none focus-visible:ring-2">
          <Avatar>
            <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar>
              <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
              {roleLabel && (
                <Badge variant="secondary" className="mt-1 w-fit text-[10px] font-normal">
                  {roleLabel}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAuthenticated && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${portal}/profile`}>
                  <BadgeCheck />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${portal}/settings`}>
                  <SettingsIcon />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${portal}/notifications`}>
                  <Bell />
                  Notifications
                </Link>
              </DropdownMenuItem>
              {portal === "account" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account/security">
                    <ShieldIcon />
                    Security
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
