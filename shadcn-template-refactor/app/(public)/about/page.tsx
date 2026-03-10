/**
 * About Page
 *
 * Modern bento-grid about page with glassmorphism and gradient accents.
 *
 * @route /about
 */

import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Users,
  Shield,
  Globe,
  Heart,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MapPin,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About Us | Zam Property",
  description:
    "Learn about Zam Property — Malaysia's leading multi-category marketplace for properties, vehicles, electronics, and more.",
};

const stats = [
  {
    label: "Active Listings",
    value: "15,000+",
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    label: "Verified Sellers",
    value: "2,500+",
    icon: Shield,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    label: "Happy Customers",
    value: "50,000+",
    icon: Users,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    label: "Cities Covered",
    value: "100+",
    icon: MapPin,
    gradient: "from-orange-500 to-red-500",
  },
];

const values = [
  {
    icon: Shield,
    title: "Trust & Safety",
    description:
      "Every seller is verified and every transaction is protected. We prioritize your safety above all.",
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We're building a marketplace that serves the Malaysian community with local expertise and global standards.",
    gradient: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "Our platform is designed to be accessible to everyone, regardless of technical expertise or background.",
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Heart,
    title: "Customer Obsession",
    description:
      "From search to purchase, every touchpoint is crafted to deliver the best possible experience.",
    gradient: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    icon: TrendingUp,
    title: "Innovation",
    description:
      "We continuously improve our platform with cutting-edge technology to stay ahead of market needs.",
    gradient: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    icon: Building2,
    title: "Malaysian Roots",
    description:
      "Built in Malaysia, for Malaysia. We understand the local market, culture, and business landscape.",
    gradient: "from-red-500 to-orange-500",
    bgLight: "bg-red-50 dark:bg-red-950/30",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero — Dark with gradient orbs */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-24 md:py-32 lg:py-40">
        <div className="absolute inset-0">
          <div className="absolute left-[15%] top-[20%] h-100 w-100 rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[15%] h-125 w-125 rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 md:px-6 lg:px-8 text-center">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Our Story
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
            Building Malaysia&rsquo;s
            <span className="block bg-linear-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              modern marketplace
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl">
            We connect buyers and sellers across properties, vehicles,
            electronics, and more — all in one trusted platform.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Stats — Bento cards */}
      {/* ================================================================ */}
      <section className="py-20 lg:py-24">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-3xl border border-border/50 bg-muted/30 p-6 text-center transition-all duration-500 hover:border-border hover:shadow-lg"
              >
                <div
                  className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${stat.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="mb-1 text-2xl font-bold tracking-tight lg:text-3xl">
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

      {/* ================================================================ */}
      {/* Mission — Side-by-side with rounded image */}
      {/* ================================================================ */}
      <section className="border-t py-20 lg:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <Badge
                variant="outline"
                className="mb-4 rounded-full px-4 py-1.5 text-sm"
              >
                Our Mission
              </Badge>
              <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl">
                Empowering everyone to trade with confidence
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                We believe everyone deserves a seamless, trustworthy marketplace
                experience. Our mission is to empower Malaysians to buy and sell
                with confidence, backed by verified sellers, secure
                transactions, and a platform that puts users first.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Founded in 2024, Zam Property has grown from a property
                marketplace into a comprehensive multi-category platform,
                serving thousands of buyers and sellers across Malaysia.
              </p>
            </div>
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop"
                alt="Kuala Lumpur skyline"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Values — Bento grid with colored backgrounds */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-20 lg:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full px-4 py-1.5 text-sm"
            >
              Core Values
            </Badge>
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              What drives us
            </h2>
            <p className="text-muted-foreground mx-auto max-w-lg text-lg">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className={`group relative overflow-hidden rounded-3xl border border-border/50 ${value.bgLight} p-7 transition-all duration-500 hover:border-border hover:shadow-lg`}
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${value.gradient} shadow-lg`}
                >
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA — Dark card */}
      {/* ================================================================ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-4xl bg-slate-950 p-10 md:p-14 lg:p-16">
            <div className="absolute inset-0">
              <div className="absolute -right-20 -top-20 h-87.5 w-87.5 rounded-full bg-emerald-500/20 blur-[100px]" />
              <div className="absolute -bottom-20 -left-20 h-87.5 w-87.5 rounded-full bg-blue-500/15 blur-[100px]" />
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl text-center text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-emerald-400" />
                Join the community
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Ready to get started?
              </h2>
              <p className="mb-8 text-lg text-white/50">
                Join thousands of buyers and sellers on Malaysia&rsquo;s
                fastest-growing marketplace.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="group h-12 rounded-full bg-white px-8 font-semibold text-slate-900 hover:bg-white/90"
                >
                  <Link href="/register">
                    Create an Account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 rounded-full border-white/20 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/search">Browse Listings</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
