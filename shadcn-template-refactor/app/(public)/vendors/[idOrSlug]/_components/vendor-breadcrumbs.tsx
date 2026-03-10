/**
 * Vendor Breadcrumbs Component
 *
 * SEO-friendly breadcrumb navigation for vendor profile pages.
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import type { PublicVendorProfile } from "@/lib/api/public-api";

interface VendorBreadcrumbsProps {
  vendor: PublicVendorProfile;
}

export function VendorBreadcrumbs({ vendor }: VendorBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link
            href="/search"
            className="transition-colors hover:text-foreground"
          >
            Search
          </Link>
        </li>
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="truncate font-medium text-foreground" aria-current="page">
          {vendor.name}
        </li>
      </ol>
    </nav>
  );
}
