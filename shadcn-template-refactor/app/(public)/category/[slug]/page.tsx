/**
 * Category Landing Page — Coming Soon
 *
 * Beautiful "coming soon" pages for categories that don't have
 * backend modules set up yet (automotive, jobs, electronics, etc.).
 * Each category gets a unique look with its own gradient, icon, and copy.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car,
  Briefcase,
  Smartphone,
  ShoppingBag,
  Sofa,
  Bell,
  ArrowLeft,
  Sparkles,
  Clock,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// CATEGORY DATA
// =============================================================================

const CATEGORIES: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    gradientText: string;
    bgOrb1: string;
    bgOrb2: string;
    features: string[];
  }
> = {
  automotive: {
    name: "Automotive",
    tagline: "Drive your dream",
    description:
      "Buy and sell cars, motorcycles, and commercial vehicles across Malaysia. From brand new to pre-owned, find your perfect ride.",
    icon: Car,
    gradient: "from-red-500 to-orange-500",
    gradientText: "from-red-400 via-orange-400 to-amber-400",
    bgOrb1: "bg-red-600/20",
    bgOrb2: "bg-orange-500/15",
    features: [
      "Verified vehicle history",
      "360° interior views",
      "Price comparison tools",
      "Direct seller chat",
    ],
  },
  jobs: {
    name: "Jobs",
    tagline: "Find your next opportunity",
    description:
      "Discover thousands of job openings across Malaysia. From tech to hospitality, your next career move starts here.",
    icon: Briefcase,
    gradient: "from-green-500 to-emerald-500",
    gradientText: "from-green-400 via-emerald-400 to-teal-400",
    bgOrb1: "bg-green-600/20",
    bgOrb2: "bg-emerald-500/15",
    features: [
      "Smart job matching",
      "One-click apply",
      "Salary insights",
      "Company reviews",
    ],
  },
  electronics: {
    name: "Electronics",
    tagline: "Tech at your fingertips",
    description:
      "Shop the latest gadgets, phones, laptops, and accessories. Compare prices and buy from verified sellers.",
    icon: Smartphone,
    gradient: "from-purple-500 to-violet-500",
    gradientText: "from-purple-400 via-violet-400 to-indigo-400",
    bgOrb1: "bg-purple-600/20",
    bgOrb2: "bg-violet-500/15",
    features: [
      "Authenticity guaranteed",
      "Price drop alerts",
      "Side-by-side comparison",
      "Warranty tracking",
    ],
  },
  fashion: {
    name: "Fashion",
    tagline: "Style without limits",
    description:
      "Explore fashion from local and international brands. Clothing, shoes, accessories, and more — all in one place.",
    icon: ShoppingBag,
    gradient: "from-pink-500 to-rose-500",
    gradientText: "from-pink-400 via-rose-400 to-red-400",
    bgOrb1: "bg-pink-600/20",
    bgOrb2: "bg-rose-500/15",
    features: [
      "Curated collections",
      "Virtual try-on",
      "Size guides",
      "Sustainable brands filter",
    ],
  },
  furniture: {
    name: "Furniture",
    tagline: "Make your space yours",
    description:
      "Browse quality furniture for every room. From modern minimalist to classic designs, furnish your home with confidence.",
    icon: Sofa,
    gradient: "from-amber-500 to-yellow-500",
    gradientText: "from-amber-400 via-yellow-400 to-orange-400",
    bgOrb1: "bg-amber-600/20",
    bgOrb2: "bg-yellow-500/15",
    features: [
      "AR room preview",
      "Delivery estimates",
      "Assembly service",
      "Return guarantee",
    ],
  },
};

// =============================================================================
// METADATA
// =============================================================================

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES[slug];
  if (!category) return { title: "Not Found" };

  return {
    title: `${category.name} — Coming Soon | Zam Property`,
    description: category.description,
  };
}

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

// =============================================================================
// PAGE
// =============================================================================

export default async function CategoryComingSoonPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const category = CATEGORIES[slug];
  if (!category) notFound();

  const Icon = category.icon;

  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero */}
      {/* ================================================================ */}
      <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-slate-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div
            className={`absolute left-[15%] top-[25%] h-96 w-96 rounded-full ${category.bgOrb1} blur-[120px]`}
          />
          <div
            className={`absolute bottom-[15%] right-[10%] h-80 w-80 rounded-full ${category.bgOrb2} blur-[100px]`}
          />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 py-20 md:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={`mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br ${category.gradient} shadow-2xl`}
            >
              <Icon className="h-10 w-10 text-white" />
            </div>

            {/* Coming Soon Badge */}
            <Badge
              variant="secondary"
              className="mb-6 rounded-full border-white/10 bg-white/5 px-5 py-2 text-sm text-white/80 backdrop-blur-sm"
            >
              <Clock className="mr-2 h-3.5 w-3.5" />
              Coming Soon
            </Badge>

            {/* Title */}
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              {category.tagline.split(" ").slice(0, -1).join(" ")}{" "}
              <span
                className={`bg-linear-to-r ${category.gradientText} bg-clip-text text-transparent`}
              >
                {category.tagline.split(" ").pop()}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/50">
              {category.description}
            </p>

            {/* Notify Form */}
            <div className="mx-auto w-full max-w-md">
              <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-12 border-0 bg-transparent pl-11 text-white placeholder:text-white/30 focus-visible:ring-0"
                  />
                </div>
                <Button className="h-12 rounded-xl bg-white px-6 font-semibold text-slate-900 hover:bg-white/90">
                  <Bell className="mr-2 h-4 w-4" />
                  Notify Me
                </Button>
              </div>
              <p className="mt-3 text-xs text-white/30">
                We&rsquo;ll let you know as soon as {category.name} launches.
                No spam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Features Preview */}
      {/* ================================================================ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full px-4 py-1.5 text-sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              What to expect
            </Badge>
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
              Features we&rsquo;re building
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg text-base">
              Here&rsquo;s a sneak peek at what&rsquo;s coming to the{" "}
              {category.name} marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {category.features.map((feature, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${category.gradient} text-white shadow-lg`}
                >
                  <span className="text-lg font-bold">{i + 1}</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{feature}</h3>
                  <p className="text-muted-foreground text-sm">
                    Coming with the {category.name} launch
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA — Browse other categories */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-16 lg:py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center md:px-6 lg:px-8">
          <h2 className="mb-3 text-xl font-bold tracking-tight md:text-2xl">
            Can&rsquo;t wait?
          </h2>
          <p className="text-muted-foreground mb-8 text-base">
            Browse our live categories while we build {category.name}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link href="/property">
                Browse Properties
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/search">
                Browse All Listings
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
