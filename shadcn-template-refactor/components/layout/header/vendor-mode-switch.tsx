"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth";
import { Role } from "@/modules/auth";

export default function VendorModeSwitch() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const cta = useMemo(() => {
    if (!isAuthenticated || !user) return null;

    if (user.role === Role.CUSTOMER) {
      return {
        label: "Business Hub",
        href: "/dashboard/account#vendor-hub",
      };
    }

    if (user.role === Role.VENDOR_ADMIN || user.role === Role.VENDOR_STAFF) {
      return {
        label: "Vendor Portal",
        href: "/dashboard/vendor",
      };
    }

    return null;
  }, [isAuthenticated, user]);

  if (!cta) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="hidden rounded-full md:inline-flex"
      onClick={() => router.push(cta.href)}
    >
      <Store className="mr-1.5 h-4 w-4" />
      {cta.label}
    </Button>
  );
}
