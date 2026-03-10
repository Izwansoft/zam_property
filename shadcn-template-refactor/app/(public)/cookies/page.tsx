/**
 * Cookie Policy Page
 *
 * Modern legal page with dark hero and card-based content sections.
 *
 * @route /cookies
 */

import Link from "next/link";
import {
  Sparkles,
  Cookie,
  Shield,
  BarChart3,
  Settings,
  Megaphone,
  Globe,
  SlidersHorizontal,
  Timer,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Cookie Policy | Zam Property",
  description: "Learn how Zam Property uses cookies and similar technologies.",
};

const sections = [
  {
    icon: Cookie,
    title: "1. What Are Cookies",
    gradient: "from-amber-500 to-orange-500",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and provide usage data that helps us improve the Service.",
    ],
  },
  {
    icon: Shield,
    title: "Essential Cookies",
    gradient: "from-blue-500 to-cyan-500",
    paragraphs: [
      "These cookies are necessary for the platform to function. They enable core features such as authentication, session management, and security. You cannot opt out of essential cookies.",
    ],
    isSubtype: true,
  },
  {
    icon: BarChart3,
    title: "Analytics Cookies",
    gradient: "from-emerald-500 to-teal-500",
    paragraphs: [
      "We use analytics cookies to understand how visitors interact with the platform. This helps us measure performance and improve the user experience. Analytics data is collected in aggregate form.",
    ],
    isSubtype: true,
  },
  {
    icon: Settings,
    title: "Preference Cookies",
    gradient: "from-purple-500 to-pink-500",
    paragraphs: [
      "These cookies remember your settings and preferences, such as language, theme, and display options, so you don't have to re-enter them each time you visit.",
    ],
    isSubtype: true,
  },
  {
    icon: Megaphone,
    title: "Marketing Cookies",
    gradient: "from-pink-500 to-rose-500",
    paragraphs: [
      "Marketing cookies may be used to deliver relevant advertisements and track campaign effectiveness. We only use marketing cookies with your consent.",
    ],
    isSubtype: true,
  },
  {
    icon: Globe,
    title: "3. Third-Party Cookies",
    gradient: "from-indigo-500 to-purple-500",
    paragraphs: [
      "Some cookies are placed by third-party services that appear on our pages, such as analytics providers (e.g., Google Analytics) and payment processors. These third parties have their own privacy policies governing how they use information.",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "4. Managing Cookies",
    gradient: "from-orange-500 to-red-500",
    paragraphs: [
      "You can control and manage cookies through your browser settings. Most browsers allow you to view stored cookies, delete them individually, block third-party cookies, block cookies from specific sites, block all cookies, or delete all cookies when you close the browser.",
      "Please note that blocking essential cookies may affect the functionality of the platform.",
    ],
  },
  {
    icon: Timer,
    title: "5. Cookie Duration",
    gradient: "from-teal-500 to-emerald-500",
    paragraphs: [
      "Session cookies are temporary and are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them manually.",
    ],
  },
  {
    icon: RefreshCw,
    title: "6. Changes to This Policy",
    gradient: "from-cyan-500 to-blue-500",
    paragraphs: [
      'We may update this Cookie Policy periodically. Changes will be posted on this page with a revised "Last updated" date.',
    ],
  },
  {
    icon: MessageSquare,
    title: "7. Contact",
    gradient: "from-red-500 to-orange-500",
    paragraphs: [],
    isContact: true,
  },
];

export default function CookiesPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero — Dark with gradient orbs */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-amber-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[15%] h-80 w-80 rounded-full bg-orange-600/10 blur-[120px]" />
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
            Cookie Policy
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/50">
            Learn how we use cookies and similar technologies to improve your
            experience.
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
                className={`group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-md md:p-8 ${
                  s.isSubtype ? "ml-6 border-l-2" : ""
                }`}
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
                <div className="space-y-3 pl-14">
                  {s.isContact ? (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      If you have questions about our use of cookies, please
                      visit our{" "}
                      <Link
                        href="/contact"
                        className="text-primary font-medium underline underline-offset-4"
                      >
                        contact page
                      </Link>{" "}
                      or email us at{" "}
                      <a
                        href="mailto:support@zamproperty.com"
                        className="text-primary font-medium underline underline-offset-4"
                      >
                        support@zamproperty.com
                      </a>
                      .
                    </p>
                  ) : (
                    s.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className="text-muted-foreground text-sm leading-relaxed"
                      >
                        {p}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Extra note linking to privacy */}
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center md:p-8">
              <p className="text-muted-foreground text-sm">
                For more information about how we handle your personal data,
                please read our{" "}
                <Link
                  href="/privacy"
                  className="text-primary font-medium underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
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
              href="/terms"
              className="rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium transition-all hover:border-border hover:shadow-sm"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium transition-all hover:border-border hover:shadow-sm"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
