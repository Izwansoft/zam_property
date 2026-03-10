import type { Metadata } from "next";
import { Scale, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ComparisonContent } from "./content";

export const metadata: Metadata = {
  title: "Compare Properties | Zam Property",
  description: "Compare properties side-by-side to find your ideal match.",
};

export default function ComparePage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Compact Dark Hero Header */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-12 md:py-16">
        <div className="absolute inset-0">
          <div className="absolute left-[15%] top-[10%] h-56 w-56 rounded-full bg-purple-600/15 blur-[100px]" />
          <div className="absolute bottom-[10%] right-[15%] h-48 w-48 rounded-full bg-pink-600/10 blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 text-center md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <Badge
              variant="secondary"
              className="mb-4 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Compare
            </Badge>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Compare{" "}
              <span className="bg-linear-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                properties
              </span>
            </h1>
            <p className="text-sm text-white/50 md:text-base">
              View key details side by side to find the best fit for you.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Comparison Content */}
      {/* ================================================================ */}
      <ComparisonContent />
    </div>
  );
}
