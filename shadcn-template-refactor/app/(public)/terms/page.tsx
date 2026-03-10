/**
 * Terms of Service Page
 *
 * Modern legal page with dark hero and card-based content sections.
 *
 * @route /terms
 */

import Link from "next/link";
import {
  FileText,
  Sparkles,
  Shield,
  Users,
  CreditCard,
  BookOpen,
  Scale,
  Globe,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Terms of Service | Zam Property",
  description: "Read the Zam Property terms of service and user agreement.",
};

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    gradient: "from-blue-500 to-cyan-500",
    content:
      'By accessing or using the Zam Property platform ("Service"), operated by Lamanniaga Sdn. Bhd. ("Company"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access the Service.',
  },
  {
    icon: Globe,
    title: "2. Description of Service",
    gradient: "from-emerald-500 to-teal-500",
    content:
      "Zam Property is a multi-category marketplace platform that enables users to list, search, and transact across various categories including real estate, automotive, electronics, and more. The Company acts as an intermediary platform and does not own, sell, or purchase any listed items.",
  },
  {
    icon: Users,
    title: "3. User Accounts",
    gradient: "from-purple-500 to-pink-500",
    content:
      "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials and for all activities that occur under your account.",
  },
  {
    icon: Shield,
    title: "4. Listing Policies",
    gradient: "from-orange-500 to-amber-500",
    content:
      'Users who list items on the platform ("Sellers") must ensure that all information provided is accurate and not misleading. Prohibited items include counterfeit goods, illegal substances, and items that violate intellectual property rights. The Company reserves the right to remove any listing at its sole discretion.',
  },
  {
    icon: CreditCard,
    title: "5. Fees and Payments",
    gradient: "from-red-500 to-orange-500",
    content:
      "Certain services may be subject to fees as described in the applicable plan or pricing page. The Company reserves the right to change its fee structure with reasonable notice to users.",
  },
  {
    icon: BookOpen,
    title: "6. Intellectual Property",
    gradient: "from-indigo-500 to-purple-500",
    content:
      "All content, trademarks, and other intellectual property on the platform belong to the Company or its licensors. Users retain ownership of content they submit but grant the Company a non-exclusive, worldwide license to use such content for operating the Service.",
  },
  {
    icon: Scale,
    title: "7. Limitation of Liability",
    gradient: "from-pink-500 to-rose-500",
    content:
      "The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. The total liability of the Company shall not exceed the amount paid by you to the Company in the twelve months preceding the claim.",
  },
  {
    icon: Globe,
    title: "8. Governing Law",
    gradient: "from-teal-500 to-emerald-500",
    content:
      "These Terms shall be governed by and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions.",
  },
  {
    icon: RefreshCw,
    title: "9. Changes to Terms",
    gradient: "from-amber-500 to-yellow-500",
    content:
      "The Company reserves the right to modify these Terms at any time. Changes will be effective upon posting to the platform. Continued use of the Service after changes constitutes acceptance of the modified Terms.",
  },
  {
    icon: MessageSquare,
    title: "10. Contact",
    gradient: "from-cyan-500 to-blue-500",
    content: null,
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero — Dark with gradient orbs */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[15%] h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center md:px-6 lg:px-8">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Legal
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Terms of Service
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/50">
            Please read these terms carefully before using the Zam Property
            platform.
          </p>
          <p className="mt-4 text-sm text-white/30">
            Last updated: February 1, 2026
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Content — Card-based sections */}
      {/* ================================================================ */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
          <div className="space-y-5">
            {sections.map((s) => (
              <div
                key={s.title}
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-md md:p-8"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${s.gradient} shadow-lg`}
                  >
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="pt-1.5 text-lg font-bold tracking-tight">
                    {s.title}
                  </h2>
                </div>
                {s.content ? (
                  <p className="text-muted-foreground pl-14 text-sm leading-relaxed">
                    {s.content}
                  </p>
                ) : (
                  <p className="text-muted-foreground pl-14 text-sm leading-relaxed">
                    If you have questions about these Terms, please contact us
                    at{" "}
                    <Link
                      href="/contact"
                      className="text-primary font-medium underline underline-offset-4"
                    >
                      our contact page
                    </Link>{" "}
                    or email{" "}
                    <a
                      href="mailto:legal@zamproperty.com"
                      className="text-primary font-medium underline underline-offset-4"
                    >
                      legal@zamproperty.com
                    </a>
                    .
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Legal Nav */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto max-w-3xl px-4 text-center md:px-6 lg:px-8">
          <p className="text-muted-foreground mb-4 text-sm">
            Other legal documents
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/privacy"
              className="rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium transition-all hover:border-border hover:shadow-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium transition-all hover:border-border hover:shadow-sm"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
