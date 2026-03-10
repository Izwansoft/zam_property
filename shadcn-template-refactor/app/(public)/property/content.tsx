/**
 * Property Landing Page — Client Content
 *
 * Full-featured real estate search landing page with:
 * - Hero with property-specific search bar (type, location, price, beds)
 * - Quick-search cards (Buy, Rent, New Launch)
 * - Featured property listings from API
 * - Browse by property type grid
 * - Browse by location cards
 *
 * Uses the real estate vertical search endpoint:
 *   GET /api/v1/real-estate/search
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  TrendingUp,
  Shield,
  Star,
  ChevronDown,
  Tag,
  Key,
  Sparkles,
  DollarSign,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";

// =============================================================================
// TYPES
// =============================================================================

interface PropertySearchHit {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: {
    city?: string;
    state?: string;
    address?: string;
  };
  primaryImageUrl?: string;
  attributes: {
    propertyType?: string;
    listingType?: string;
    bedrooms?: number;
    bathrooms?: number;
    builtUpSize?: number;
    furnishing?: string;
  };
  isFeatured: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
  publishedAt?: string;
}

interface PropertySearchResponse {
  data: PropertySearchHit[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: {
      propertyType?: { value: string; count: number }[];
      listingType?: { value: string; count: number }[];
      bedrooms?: { value: string; count: number }[];
      cities?: { value: string; count: number }[];
      priceRanges?: { from?: number; to?: number; count: number }[];
    };
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PROPERTY_TYPES = [
  { value: "condominium", label: "Condominium", icon: Building2 },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "terrace", label: "Terrace House", icon: Home },
  { value: "semi_detached", label: "Semi-Detached", icon: Home },
  { value: "bungalow", label: "Bungalow", icon: Home },
  { value: "townhouse", label: "Townhouse", icon: Home },
  { value: "studio", label: "Studio", icon: Building2 },
  { value: "penthouse", label: "Penthouse", icon: Building2 },
  { value: "villa", label: "Villa", icon: Home },
  { value: "land", label: "Land", icon: Maximize },
] as const;

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-300000", label: "Under RM 300K" },
  { value: "300000-500000", label: "RM 300K – 500K" },
  { value: "500000-800000", label: "RM 500K – 800K" },
  { value: "800000-1000000", label: "RM 800K – 1M" },
  { value: "1000000-2000000", label: "RM 1M – 2M" },
  { value: "2000000-5000000", label: "RM 2M – 5M" },
  { value: "5000000-", label: "RM 5M+" },
] as const;

const BEDROOM_OPTIONS = [
  { value: "", label: "Any Beds" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3 Beds" },
  { value: "4", label: "4 Beds" },
  { value: "5", label: "5+ Beds" },
] as const;

const POPULAR_LOCATIONS = [
  {
    city: "Kuala Lumpur",
    state: "WP Kuala Lumpur",
    image:
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop",
    listings: "500+",
  },
  {
    city: "Petaling Jaya",
    state: "Selangor",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
    listings: "320+",
  },
  {
    city: "Shah Alam",
    state: "Selangor",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    listings: "280+",
  },
  {
    city: "Cyberjaya",
    state: "Selangor",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
    listings: "150+",
  },
  {
    city: "Subang Jaya",
    state: "Selangor",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
    listings: "200+",
  },
  {
    city: "Puchong",
    state: "Selangor",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    listings: "180+",
  },
];

const QUICK_SEARCHES = [
  {
    label: "Buy Property",
    description: "Find your dream home",
    icon: Home,
    listingType: "sale",
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "Rent Property",
    description: "Discover rental options",
    icon: Key,
    listingType: "rent",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "New Launches",
    description: "Latest new developments",
    icon: Sparkles,
    listingType: "sale",
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    featured: true,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function formatPropertyType(value: string): string {
  const map: Record<string, string> = {
    apartment: "Apartment",
    condominium: "Condominium",
    terrace: "Terrace",
    semi_detached: "Semi-D",
    bungalow: "Bungalow",
    townhouse: "Townhouse",
    studio: "Studio",
    penthouse: "Penthouse",
    duplex: "Duplex",
    villa: "Villa",
    shop_lot: "Shop Lot",
    office: "Office",
    warehouse: "Warehouse",
    factory: "Factory",
    land: "Land",
  };
  return map[value] || value;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `RM ${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (price >= 1_000) {
    return `RM ${(price / 1_000).toFixed(0)}K`;
  }
  return `RM ${price.toLocaleString()}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PropertyContent() {
  const router = useRouter();

  // ─── Search Form State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [listingType, setListingType] = useState("sale");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [location, setLocation] = useState("");

  // ─── Featured Listings Query ────────────────────────────────────────
  const { data: featuredData, isLoading: featuredLoading } =
    useQuery<PropertySearchResponse>({
      queryKey: queryKeys.search.listings({
        vertical: "real_estate",
        featured: true,
        limit: 8,
      }),
      queryFn: async () => {
        const res = await apiClient.get<PropertySearchResponse>(
          "/real-estate/search",
          {
            params: {
              featuredOnly: true,
              pageSize: 8,
              sort: "newest",
            },
          },
        );
        return res.data;
      },
      placeholderData: keepPreviousData,
    });

  // ─── Latest Listings Query ──────────────────────────────────────────
  const { data: latestData, isLoading: latestLoading } =
    useQuery<PropertySearchResponse>({
      queryKey: queryKeys.search.listings({
        vertical: "real_estate",
        latest: true,
        limit: 8,
      }),
      queryFn: async () => {
        const res = await apiClient.get<PropertySearchResponse>(
          "/real-estate/search",
          {
            params: {
              pageSize: 8,
              sort: "newest",
            },
          },
        );
        return res.data;
      },
      placeholderData: keepPreviousData,
    });

  const featuredListings = featuredData?.data ?? [];
  const latestListings = latestData?.data ?? [];
  // Use latest if no featured
  const displayListings =
    featuredListings.length > 0 ? featuredListings : latestListings;

  // ─── Search Handler ─────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    params.set("vertical", "real_estate");

    if (searchQuery) params.set("q", searchQuery);
    if (listingType) params.set("listingType", listingType);
    if (propertyType) params.set("propertyType", propertyType);
    if (location) params.set("city", location);
    if (bedrooms) params.set("bedroomsMin", bedrooms);

    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.set("priceMin", min);
      if (max) params.set("priceMax", max);
    }

    router.push(`/search?${params.toString()}`);
  }, [
    router,
    searchQuery,
    listingType,
    propertyType,
    priceRange,
    bedrooms,
    location,
  ]);

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero Section */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 pb-32 pt-20 lg:pb-40 lg:pt-28">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[15%] h-80 w-80 rounded-full bg-emerald-500/15 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm"
            >
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Malaysia&rsquo;s Property Marketplace
            </Badge>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Find your perfect{" "}
              <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                property
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
              Search thousands of verified properties across Malaysia. Buy,
              rent, or invest with confidence.
            </p>
          </div>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* Search Panel */}
          {/* ────────────────────────────────────────────────────────────── */}
          <div className="mx-auto max-w-5xl">
            {/* Buy / Rent Toggle */}
            <div className="mb-4 flex gap-1">
              <button
                onClick={() => setListingType("sale")}
                className={`rounded-t-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                  listingType === "sale"
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setListingType("rent")}
                className={`rounded-t-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                  listingType === "rent"
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                Rent
              </button>
            </div>

            {/* Search Bar */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:p-5">
              {/* Row 1: Text Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  placeholder="Search by location, project or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-13 rounded-xl border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/30 focus-visible:ring-white/20"
                />
              </div>

              {/* Row 2: Filters */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Property Type */}
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-white [&>span]:text-white/60">
                    <Building2 className="mr-2 h-4 w-4 text-white/40" />
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range */}
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-white [&>span]:text-white/60">
                    <DollarSign className="mr-2 h-4 w-4 text-white/40" />
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((pr) => (
                      <SelectItem
                        key={pr.value || "any"}
                        value={pr.value || "any"}
                      >
                        {pr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Bedrooms */}
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-white [&>span]:text-white/60">
                    <Bed className="mr-2 h-4 w-4 text-white/40" />
                    <SelectValue placeholder="Bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {BEDROOM_OPTIONS.map((b) => (
                      <SelectItem
                        key={b.value || "any"}
                        value={b.value || "any"}
                      >
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search Button */}
                <Button
                  size="lg"
                  onClick={handleSearch}
                  className="h-11 rounded-xl bg-white px-6 font-semibold text-slate-900 transition-all hover:bg-white/90"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            {/* Popular searches */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-white/40">Popular:</span>
              {[
                "Condo KL",
                "Bangsar",
                "Mont Kiara",
                "KLCC",
                "Cyberjaya",
                "Penthouse",
              ].map((tag) => (
                <Link
                  key={tag}
                  href={`/search?vertical=real_estate&q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Quick-Search Cards */}
      {/* ================================================================ */}
      <section className="-mt-16 relative z-20 pb-12 lg:-mt-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {QUICK_SEARCHES.map((item) => (
              <Link
                key={item.label}
                href={`/search?vertical=real_estate&listingType=${item.listingType}${item.featured ? "&featuredOnly=true" : ""}`}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 ${item.bg} p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl`}
              >
                <div
                  className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${item.gradient} shadow-lg`}
                >
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{item.label}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
                <ArrowRight className="text-muted-foreground absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Featured Properties */}
      {/* ================================================================ */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-3 rounded-full px-4 py-1.5 text-sm"
              >
                <Star className="mr-1.5 h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
              <h2 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                Featured properties
              </h2>
              <p className="text-muted-foreground text-base">
                Hand-picked properties from verified agents
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              className="group self-start rounded-full md:self-auto"
            >
              <Link href="/search?vertical=real_estate&featuredOnly=true">
                View all
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Listing Grid */}
          {(featuredLoading || latestLoading) &&
          displayListings.length === 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-border/50"
                >
                  <div className="aspect-4/3 bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-5 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayListings.slice(0, 8).map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/50 py-16 text-center">
              <Building2 className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                No properties found. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* Browse by Property Type */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
              Browse by property type
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg text-base">
              Find exactly what you&rsquo;re looking for
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {PROPERTY_TYPES.map((pt) => (
              <Link
                key={pt.value}
                href={`/search?vertical=real_estate&propertyType=${pt.value}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                  <pt.icon className="text-muted-foreground h-6 w-6 transition-colors group-hover:text-primary" />
                </div>
                <span className="text-sm font-medium">{pt.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Browse by Location */}
      {/* ================================================================ */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                Popular locations
              </h2>
              <p className="text-muted-foreground text-base">
                Top areas in the Klang Valley
              </p>
            </div>
            <Button
              variant="outline"
              asChild
              className="group self-start rounded-full md:self-auto"
            >
              <Link href="/search?vertical=real_estate">
                All locations
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_LOCATIONS.map((loc) => (
              <Link
                key={loc.city}
                href={`/search?vertical=real_estate&city=${encodeURIComponent(loc.city)}`}
                className="group relative overflow-hidden rounded-2xl border border-border/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-xl"
              >
                <div className="relative aspect-16/10 overflow-hidden">
                  <Image
                    src={loc.image}
                    alt={loc.city}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="mb-0.5 text-lg font-semibold text-white">
                      {loc.city}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/60">{loc.state}</p>
                      <Badge className="rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/20">
                        {loc.listings} listings
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Trust / Stats Bar */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-16 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              {
                value: "2,500+",
                label: "Properties Listed",
                icon: Building2,
              },
              {
                value: "500+",
                label: "Verified Agents",
                icon: Shield,
              },
              {
                value: "10,000+",
                label: "Happy Customer",
                icon: Star,
              },
              {
                value: "50+",
                label: "Cities Covered",
                icon: MapPin,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="text-primary h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA */}
      {/* ================================================================ */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-10 md:p-16">
            <div className="absolute inset-0">
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-[100px]" />
            </div>
            <div className="relative z-10 mx-auto max-w-2xl text-center text-white">
              <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                Are you a property owner, agent, or agency?
              </h2>
              <p className="mb-8 text-base text-white/50 md:text-lg">
                List your properties and reach thousands of potential buyers and
                partners across Malaysia.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full bg-white px-8 font-semibold text-slate-900 hover:bg-white/90"
                >
                  <Link href="/register/vendor">
                    Register as property vendor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/about">Learn more</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Property Card Component
// =============================================================================

function PropertyCard({ listing }: { listing: PropertySearchHit }) {
  const attrs = listing.attributes;

  return (
    <Link
      href={`/listing/${listing.slug || listing.id}`}
      className="group block"
    >
      <div className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-xl">
        {/* Image */}
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {listing.primaryImageUrl ? (
            <Image
              src={listing.primaryImageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="text-muted-foreground/40 h-12 w-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {attrs.propertyType && (
              <Badge className="rounded-full bg-white/90 text-xs text-gray-900 shadow-sm hover:bg-white">
                {formatPropertyType(attrs.propertyType)}
              </Badge>
            )}
            {listing.isFeatured && (
              <Badge className="rounded-full bg-yellow-500/90 text-xs text-white shadow-sm hover:bg-yellow-500">
                <Sparkles className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>

          {/* Listing type badge */}
          {attrs.listingType && (
            <Badge
              className={`absolute right-3 top-3 rounded-full text-xs text-white shadow-sm ${
                attrs.listingType === "rent"
                  ? "bg-emerald-600/90 hover:bg-emerald-600"
                  : "bg-blue-600/90 hover:bg-blue-600"
              }`}
            >
              {attrs.listingType === "rent" ? "For Rent" : "For Sale"}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="text-primary mb-1.5 text-lg font-bold">
            {listing.price
              ? `RM ${listing.price.toLocaleString()}`
              : "Price on Request"}
            {attrs.listingType === "rent" && (
              <span className="text-muted-foreground text-sm font-normal">
                /mo
              </span>
            )}
          </p>

          {/* Title */}
          <h3 className="group-hover:text-primary mb-2 line-clamp-2 text-sm font-semibold leading-snug transition-colors">
            {listing.title}
          </h3>

          {/* Location */}
          {listing.location.city && (
            <div className="text-muted-foreground mb-3 flex items-center text-xs">
              <MapPin className="mr-1 h-3 w-3 shrink-0" />
              <span className="truncate">
                {listing.location.city}
                {listing.location.state &&
                  `, ${listing.location.state}`}
              </span>
            </div>
          )}

          {/* Attributes Row */}
          <div className="flex items-center gap-3 border-t pt-3">
            {attrs.bedrooms != null && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Bed className="h-3.5 w-3.5" />
                <span>{attrs.bedrooms}</span>
              </div>
            )}
            {attrs.bathrooms != null && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Bath className="h-3.5 w-3.5" />
                <span>{attrs.bathrooms}</span>
              </div>
            )}
            {attrs.builtUpSize != null && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Maximize className="h-3.5 w-3.5" />
                <span>{attrs.builtUpSize.toLocaleString()} sqft</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
