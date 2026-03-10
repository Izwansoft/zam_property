/**
 * Privacy Policy Page
 *
 * Modern legal page with dark hero and card-based content sections.
 *
 * @route /privacy
 */

import Link from "next/link";
import {
  Sparkles,
  Eye,
  Database,
  Share2,
  Lock,
  Cookie,
  Clock,
  UserCheck,
  Baby,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Privacy Policy | Zam Property",
  description:
    "Read the Zam Property privacy policy to understand how we collect, use, and protect your data.",
};

const sections = [
  {
    icon: Eye,
    title: "1. Information We Collect",
    gradient: "from-blue-500 to-cyan-500",
    paragraphs: [
      "We collect information you provide directly when creating an account, listing items, or contacting us. This includes your name, email address, phone number, and any content you submit to the platform.",
      "We also automatically collect usage data such as IP address, browser type, device information, pages visited, and interaction patterns to improve our Service.",
    ],
  },
  {
    icon: Database,
    title: "2. How We Use Your Information",
    gradient: "from-emerald-500 to-teal-500",
    paragraphs: [
      "We use collected information to: provide, maintain, and improve the Service; process listings and facilitate transactions; send notifications, updates, and marketing communications; detect and prevent fraud and abuse; comply with legal obligations; and analyze usage patterns to improve user experience.",
    ],
  },
  {
    icon: Share2,
    title: "3. Information Sharing",
    gradient: "from-purple-500 to-pink-500",
    paragraphs: [
      "We do not sell your personal information. We may share information with trusted third-party service providers who assist in operating the platform (e.g., cloud hosting, payment processing, analytics). We may also disclose information when required by law or to protect our rights and safety.",
    ],
  },
  {
    icon: Lock,
    title: "4. Data Security",
    gradient: "from-orange-500 to-amber-500",
    paragraphs: [
      "We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    icon: Cookie,
    title: "5. Cookies and Tracking",
    gradient: "from-red-500 to-orange-500",
    paragraphs: [
      "We use cookies and similar technologies to enhance your experience, remember preferences, and analyze platform usage. You can control cookie preferences through your browser settings.",
    ],
    link: { href: "/cookies", label: "Cookie Policy" },
  },
  {
    icon: Clock,
    title: "6. Data Retention",
    gradient: "from-indigo-500 to-purple-500",
    paragraphs: [
      "We retain your personal data for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data at any time through your account settings.",
    ],
  },
  {
    icon: UserCheck,
    title: "7. Your Rights",
    gradient: "from-pink-500 to-rose-500",
    paragraphs: [
      "Under the Personal Data Protection Act 2010 (PDPA) of Malaysia, you have the right to access, correct, and delete your personal data. You may also withdraw consent for data processing at any time by contacting us.",
    ],
  },
  {
    icon: Baby,
    title: "8. Children's Privacy",
    gradient: "from-teal-500 to-emerald-500",
    paragraphs: [
      "The Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.",
    ],
  },
  {
    icon: RefreshCw,
    title: "9. Changes to This Policy",
    gradient: "from-amber-500 to-yellow-500",
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page with a revised "Last updated" date.',
    ],
  },
  {
    icon: MessageSquare,
    title: "10. Contact",
    gradient: "from-cyan-500 to-blue-500",
    paragraphs: [],
    isContact: true,
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero — Dark with gradient orbs */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute left-[15%] top-[25%] h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[20%] h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
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
            Privacy Policy
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/50">
            Understand how we collect, use, and protect your personal data.
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
                <div className="space-y-3 pl-14">
                  {s.isContact ? (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      For privacy-related inquiries, please contact our Data
                      Protection Officer at{" "}
                      <a
                        href="mailto:privacy@zamproperty.com"
                        className="text-primary font-medium underline underline-offset-4"
                      >
                        privacy@zamproperty.com
                      </a>{" "}
                      or visit our{" "}
                      <Link
                        href="/contact"
                        className="text-primary font-medium underline underline-offset-4"
                      >
                        contact page
                      </Link>
                      .
                    </p>
                  ) : (
                    <>
                      {s.paragraphs.map((p, i) => (
                        <p
                          key={i}
                          className="text-muted-foreground text-sm leading-relaxed"
                        >
                          {p}
                        </p>
                      ))}
                      {s.link && (
                        <p className="text-sm">
                          For more details, see our{" "}
                          <Link
                            href={s.link.href}
                            className="text-primary font-medium underline underline-offset-4"
                          >
                            {s.link.label}
                          </Link>
                          .
                        </p>
                      )}
                    </>
                  )}
                </div>
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
              href="/terms"
              className="rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium transition-all hover:border-border hover:shadow-sm"
            >
              Terms of Service
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
