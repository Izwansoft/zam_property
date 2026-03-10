/**
 * Categories Grid Component
 *
 * Displays the bento-style categories grid with maintenance status indicators.
 * Client component to enable maintenance status hooks.
 *
 * @see docs/DEVELOPMENT-CHEATSHEET.md - Session 4.7
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Car,
  Briefcase,
  ShoppingBag,
  Smartphone,
  Sofa,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAllMaintenanceStatuses } from "@/modules/vertical/hooks/use-maintenance";

// =============================================================================
// Data
// =============================================================================

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
  count: string;
  image: string;
  comingSoon?: boolean;
}

const categories: Category[] = [
  {
    id: "real_estate",
    name: "Real Estate",
    icon: Home,
    gradient: "from-blue-500 to-cyan-500",
    count: "2,500+",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop",
  },
  {
    id: "automotive",
    name: "Automotive",
    icon: Car,
    gradient: "from-red-500 to-orange-500",
    count: "1,200+",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&h=200&fit=crop",
    comingSoon: true,
  },
  {
    id: "jobs",
    name: "Jobs",
    icon: Briefcase,
    gradient: "from-green-500 to-emerald-500",
    count: "800+",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=300&h=200&fit=crop",
    comingSoon: true,
  },
  {
    id: "electronics",
    name: "Electronics",
    icon: Smartphone,
    gradient: "from-purple-500 to-violet-500",
    count: "3,100+",
    image:
      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&h=200&fit=crop",
    comingSoon: true,
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: ShoppingBag,
    gradient: "from-pink-500 to-rose-500",
    count: "4,200+",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=200&fit=crop",
    comingSoon: true,
  },
  {
    id: "furniture",
    name: "Furniture",
    icon: Sofa,
    gradient: "from-amber-500 to-yellow-500",
    count: "950+",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop",
    comingSoon: true,
  },
];

// =============================================================================
// Component
// =============================================================================

/**
 * Determine which items should span 2 rows for a balanced bento grid.
 * For n items in a 3-column grid, we want to fill without gaps.
 */
function getSpanIndices(count: number): Set<number> {
  // For asymmetric bento grid:
  // 6 items + info card with indices 0 (Real Estate) and 3 (Electronics) spanning 2 rows
  //   Row 1: [0-RealEstate-tall], [1-Automotive], [2-Jobs]
  //   Row 2: [0-cont], [3-Electronics-tall], [4-Fashion]
  //   Row 3: [5-Furniture], [3-cont], [Info Card]
  if (count <= 3) return new Set();
  if (count === 4) return new Set([0, 2]);
  if (count === 5) return new Set([0, 2]);
  if (count === 6) return new Set([0, 3]); // Real Estate and Electronics tall
  // For 7+ items
  return new Set([0, 3]);
}

export function CategoriesGrid() {
  const { data: maintenanceStatuses } = useAllMaintenanceStatuses();
  const spanIndices = getSpanIndices(categories.length);

  // Helper to check if a category is under maintenance
  const isUnderMaintenance = (categoryId: string): boolean => {
    if (!maintenanceStatuses) return false;
    const status = maintenanceStatuses.find((s) => s.type === categoryId);
    return status?.isUnderMaintenance ?? false;
  };

  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center text-center">
          <Badge
            variant="outline"
            className="mb-4 rounded-full px-4 py-1.5 text-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Categories
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Explore by category
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg">
            Browse thousands of verified listings across every category
          </p>
        </div>

        {/* Bento grid — asymmetric with dense packing */}
        <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-flow-dense">
          {categories.map((category, index) => {
            const underMaintenance = isUnderMaintenance(category.id);
            const isComingSoon = category.comingSoon;
            const isDisabled = underMaintenance || isComingSoon;
            
            // Determine href - disable link for coming soon
            const href = isComingSoon
              ? "#"
              : category.id === "real_estate"
                ? "/property"
                : `/category/${category.id}`;
            
            return (
              <Link
                key={category.id}
                href={href}
                onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
                className={`group relative overflow-hidden rounded-3xl border border-border/50 transition-all duration-500 hover:border-border hover:shadow-2xl ${
                  !isComingSoon ? "hover:-translate-y-1" : ""
                } ${spanIndices.has(index) ? "row-span-2" : ""}`}
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={`object-cover transition-transform duration-700 ${
                    !isDisabled ? "group-hover:scale-105" : ""
                  } ${isDisabled ? "grayscale" : ""}`}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                {/* Disabled overlay (maintenance or coming soon) */}
                {isDisabled && (
                  <div className="absolute inset-0 bg-black/50" />
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${category.gradient} shadow-lg ${
                        isDisabled ? "opacity-50" : ""
                      }`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {category.name}
                      </h3>
                      {underMaintenance ? (
                        <p className="text-sm text-amber-400">
                          Under maintenance
                        </p>
                      ) : isComingSoon ? (
                        <p className="text-sm text-blue-400">
                          Coming soon
                        </p>
                      ) : (
                        <p className="text-sm text-white/60">
                          {category.count} listings
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coming Soon Hover Overlay */}
                {isComingSoon && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {/* Gradient orbs */}
                    <div className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full bg-purple-600/20 blur-[60px]" />
                    <div className="absolute bottom-[10%] right-[10%] h-40 w-40 rounded-full bg-blue-600/15 blur-[60px]" />
                    <div className="absolute left-[50%] top-[60%] h-24 w-24 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[50px]" />
                    {/* Dot grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[16px_16px]" />
                    
                    <div className="relative z-10 text-center">
                      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${category.gradient} shadow-lg`}>
                        <category.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-white">
                        {category.name}
                      </h3>
                      <p className="mb-1 text-sm font-medium text-blue-400">
                        Coming Soon
                      </p>
                      <p className="max-w-52 text-xs text-white/60">
                        Exciting features are on the way. Stay tuned for amazing listings!
                      </p>
                    </div>
                  </div>
                )}

                {/* Arrow (hidden when disabled) */}
                {!isDisabled && (
                  <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                )}
              </Link>
            );
          })}

          {/* Informational Card — More Categories Coming */}
          <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/50 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-center">
            {/* Gradient orbs */}
            <div className="absolute left-[10%] top-[20%] h-24 w-24 rounded-full bg-purple-600/20 blur-[50px]" />
            <div className="absolute bottom-[10%] right-[10%] h-32 w-32 rounded-full bg-blue-600/15 blur-[50px]" />
            <div className="absolute left-[50%] top-[60%] h-20 w-20 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-2xl" />
            {/* Dot grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[16px_16px]" />
            
            <div className="relative z-10">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white">
                More Coming
              </h3>
              <p className="text-xs text-white/60">
                New categories launching soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
