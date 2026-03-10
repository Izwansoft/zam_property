/**
 * Public Home Page
 *
 * Modern bento-grid marketplace landing page with glassmorphism,
 * gradient accents, and contemporary design patterns.
 *
 * @see docs/DEVELOPMENT-CHEATSHEET.md - Session 4.7
 */

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  MessageCircle,
  Handshake,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoriesGrid } from "./components/categories-grid";

// =============================================================================
// DATA
// =============================================================================

const featuredListings = [
  {
    id: "1",
    title: "Modern Condo in Bukit Bintang",
    category: "Real Estate",
    price: "RM 780,000",
    location: "Kuala Lumpur",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 128,
    seller: "Sunrise Properties",
    sellerAvatar: "https://i.pravatar.cc/40?img=1",
    verified: true,
  },
  {
    id: "2",
    title: "2023 Toyota Camry 2.5V",
    category: "Automotive",
    price: "RM 185,000",
    location: "Petaling Jaya",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 56,
    seller: "Auto Kings",
    sellerAvatar: "https://i.pravatar.cc/40?img=2",
    verified: true,
  },
  {
    id: "3",
    title: "iPhone 15 Pro Max 256GB",
    category: "Electronics",
    price: "RM 5,499",
    location: "Shah Alam",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop",
    rating: 5.0,
    reviews: 234,
    seller: "Tech Haven",
    sellerAvatar: "https://i.pravatar.cc/40?img=3",
    verified: false,
  },
  {
    id: "4",
    title: "Spacious Family Home",
    category: "Real Estate",
    price: "RM 1,250,000",
    location: "Bangsar",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 89,
    seller: "Urban Nest",
    sellerAvatar: "https://i.pravatar.cc/40?img=4",
    verified: true,
  },
];

const testimonials = [
  {
    id: 1,
    name: "Sarah Ahmad",
    role: "Property Buyer",
    avatar: "https://i.pravatar.cc/80?img=5",
    content:
      "Found my dream home within a week! The verified sellers gave me confidence to make the purchase.",
    rating: 5,
  },
  {
    id: 2,
    name: "David Tan",
    role: "Car Enthusiast",
    avatar: "https://i.pravatar.cc/80?img=8",
    content:
      "Best platform for finding quality used cars. The detailed listings saved me so much time.",
    rating: 5,
  },
  {
    id: 3,
    name: "Aisha Rahman",
    role: "Small Business Owner",
    avatar: "https://i.pravatar.cc/80?img=9",
    content:
      "Started selling on Zam Property 6 months ago. Already made over RM50k in sales!",
    rating: 5,
  },
];

// =============================================================================
// PAGE
// =============================================================================

export default function PublicHomePage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ================================================================== */}
      {/* Hero Section — Minimal with bold typography */}
      {/* ================================================================== */}
      <section className="relative flex min-h-[85vh] items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Mesh gradient orbs */}
          <div className="absolute left-[10%] top-[20%] h-125 w-125 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] h-150 w-150 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute left-[50%] top-[60%] h-100 w-100 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[100px]" />
          {/* Dot grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Live indicator */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              15,000+ listings live now
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl xl:text-8xl">
              Buy, Rent &amp; sell
              <span className="block bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                anything.
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg text-white/50 md:text-xl">
              Malaysia&rsquo;s modern marketplace for properties, vehicles,
              electronics, and more.
            </p>

            {/* Search Bar — glassmorphism */}
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-md sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <Input
                    placeholder="Search properties, cars, electronics..."
                    className="h-13 border-0 bg-transparent pl-12 text-base text-white placeholder:text-white/30 focus-visible:ring-0"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-13 rounded-xl bg-white px-8 font-semibold text-slate-900 transition-all hover:bg-white/90"
                  asChild
                >
                  <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Link>
                </Button>
              </div>

              {/* Popular tags */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-white/40">Popular:</span>
                {[
                  "Condo KL",
                  "Toyota",
                  "iPhone 15",
                  "Remote Jobs",
                  "Laptop",
                ].map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-sm text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Bento Categories Grid */}
      {/* ================================================================== */}
      <CategoriesGrid />

      {/* ================================================================== */}
      {/* Featured Listings */}
      {/* ================================================================== */}
      <section className="border-t bg-muted/30 py-24 lg:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-4 rounded-full px-4 py-1.5 text-sm"
              >
                <Star className="mr-1.5 h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
              <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Popular right now
              </h2>
              <p className="text-muted-foreground text-lg">
                Hand-picked from our top verified sellers
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="group self-start rounded-full md:self-auto"
            >
              <Link href="/search?featured=true">
                View all
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredListings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <div className="group h-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-xl">
                  {/* Image */}
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-gray-900 shadow-sm hover:bg-white">
                      {listing.category}
                    </Badge>
                    <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white group-hover:opacity-100">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Image
                        src={listing.sellerAvatar}
                        alt={listing.seller}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-muted-foreground text-xs">
                        {listing.seller}
                      </span>
                      {listing.verified && (
                        <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white" />
                      )}
                    </div>

                    <h3 className="group-hover:text-primary mb-3 line-clamp-2 text-sm font-semibold leading-snug transition-colors">
                      {listing.title}
                    </h3>

                    <div className="mb-3 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {listing.rating}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({listing.reviews})
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="text-muted-foreground flex items-center text-xs">
                        <MapPin className="mr-1 h-3 w-3" />
                        {listing.location}
                      </div>
                      <p className="text-primary text-base font-bold">
                        {listing.price}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* How It Works — Bento Cards */}
      {/* ================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full px-4 py-1.5 text-sm"
            >
              Simple Process
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              How it works
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg text-lg">
              Three simple steps to find what you need
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & Discover",
                description:
                  "Browse thousands of verified listings. Use smart filters to narrow down exactly what you need.",
                gradient: "from-blue-500 to-cyan-500",
                bgLight: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                step: "02",
                icon: MessageCircle,
                title: "Connect & Chat",
                description:
                  "Message sellers directly through our secure platform. Ask questions and negotiate in real-time.",
                gradient: "from-purple-500 to-pink-500",
                bgLight: "bg-purple-50 dark:bg-purple-950/30",
              },
              {
                step: "03",
                icon: Handshake,
                title: "Deal & Done",
                description:
                  "Finalize with confidence. Verified sellers, listers, and buyer protection keep every transaction safe.",
                gradient: "from-emerald-500 to-teal-500",
                bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl border border-border/50 ${item.bgLight} p-8 transition-all duration-500 hover:border-border hover:shadow-lg lg:p-10`}
              >
                {/* Step number watermark */}
                <span className="absolute -right-4 -top-6 text-[120px] font-black leading-none text-black/3 dark:text-white/3">
                  {item.step}
                </span>

                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${item.gradient} shadow-lg`}
                >
                  <item.icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Testimonials — Glass cards on dark */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white lg:py-32">
        <div className="absolute inset-0">
          <div className="absolute right-[10%] top-[20%] h-100 w-100 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] left-[15%] h-125 w-125 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="secondary"
              className="mb-4 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Testimonials
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Loved by thousands
            </h2>
            <p className="mx-auto max-w-lg text-lg text-white/50">
              Real stories from our community
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group rounded-3xl border border-white/8 bg-white/5 p-6 backdrop-blur-sm transition-all duration-500 hover:border-white/15 hover:bg-white/8 lg:p-8"
              >
                <div className="mb-5 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>

                <p className="mb-6 leading-relaxed text-white/70">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-3 border-t border-white/8 pt-5">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={44}
                    height={44}
                    className="rounded-full ring-2 ring-white/10"
                  />
                  <div>
                    <p className="text-sm font-semibold">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* Stats — Bento cards with colored backgrounds */}
      {/* ================================================================== */}
      <section className="border-b py-24 lg:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                value: "15,000+",
                label: "Active Listings",
                icon: TrendingUp,
                gradient: "from-blue-500 to-cyan-500",
                bgLight: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                value: "2,500+",
                label: "Verified Sellers",
                icon: Shield,
                gradient: "from-emerald-500 to-teal-500",
                bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
              },
              {
                value: "50,000+",
                label: "Happy Customers",
                icon: Users,
                gradient: "from-purple-500 to-pink-500",
                bgLight: "bg-purple-50 dark:bg-purple-950/30",
              },
              {
                value: "100+",
                label: "Cities Covered",
                icon: MapPin,
                gradient: "from-orange-500 to-red-500",
                bgLight: "bg-orange-50 dark:bg-orange-950/30",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className={`group rounded-3xl border border-border/50 ${stat.bgLight} p-6 text-center transition-all duration-500 hover:border-border hover:shadow-lg lg:p-8`}
              >
                <div
                  className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${stat.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mb-1 text-3xl font-bold tracking-tight lg:text-4xl">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CTA — Clean dark card */}
      {/* ================================================================== */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-slate-950 p-10 md:p-16 lg:p-20">
            <div className="absolute inset-0">
              <div className="absolute -right-20 -top-20 h-100 w-100 rounded-full bg-emerald-500/20 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-100 w-100 rounded-full bg-blue-500/15 blur-[100px]" />
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-emerald-400" />
                Start selling in minutes
              </div>

              <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Ready to get started?
              </h2>
              <p className="mb-10 text-lg text-white/50 md:text-xl">
                Join thousands of successful sellers. List your first item for
                free today.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="group h-13 rounded-full bg-white px-8 text-base font-semibold text-slate-900 hover:bg-white/90"
                >
                  <Link href="/register">
                    Start selling for free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-13 rounded-full border-white/20 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
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
