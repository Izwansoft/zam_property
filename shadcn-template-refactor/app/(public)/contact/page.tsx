/**
 * Contact Page
 *
 * Modern contact page with glassmorphism cards and clean form design.
 *
 * @route /contact
 */

import { Mail, Phone, MapPin, Clock, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Contact Us | Zam Property",
  description:
    "Get in touch with the Zam Property team. We're here to help with any questions or feedback.",
};

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: [
      "Level 10, Menara XYZ",
      "Jalan Sultan Ismail",
      "50250 Kuala Lumpur, Malaysia",
    ],
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+60 3-1234 5678", "Mon–Fri, 9am–6pm MYT"],
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["support@zamproperty.com", "business@zamproperty.com"],
    gradient: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: [
      "Monday–Friday: 9:00 AM – 6:00 PM",
      "Saturday: 10:00 AM – 2:00 PM",
      "Sunday & Public Holidays: Closed",
    ],
    gradient: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Hero — Dark with gradient orbs */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
        <div className="absolute inset-0">
          <div className="absolute left-[20%] top-[20%] h-87.5 w-87.5 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[20%] h-100 w-100 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 md:px-6 lg:px-8 text-center">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Get in Touch
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Contact Us
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/50">
            Have a question or feedback? We&rsquo;d love to hear from you. Our
            team is ready to help.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Contact Info — Bento cards */}
      {/* ================================================================ */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {contactInfo.map((item) => (
              <div
                key={item.title}
                className={`group rounded-3xl border border-border/50 ${item.bgLight} p-5 transition-all duration-500 hover:border-border hover:shadow-lg`}
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${item.gradient} shadow-lg`}
                >
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{item.title}</h3>
                {item.lines.map((line) => (
                  <p
                    key={line}
                    className="text-muted-foreground text-xs leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Form Section */}
      {/* ================================================================ */}
      <section className="border-t bg-muted/30 py-16 lg:py-24">
        <div className="container mx-auto max-w-2xl px-4 md:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
              Send us a message
            </h2>
            <p className="text-muted-foreground text-sm">
              Fill out the form below and we&rsquo;ll get back to you within 1
              business day.
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm md:p-8">
            <form className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="How can we help?"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="button"
                size="lg"
                className="w-full rounded-xl sm:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
