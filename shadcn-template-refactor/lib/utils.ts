import { Metadata } from "next";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter((name: string) => name);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

const AVATAR_FALLBACK_CLASSES = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-lime-100 text-lime-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-fuchsia-100 text-fuchsia-700",
] as const;

/**
 * Pick a stable color pair for avatar fallbacks based on the input string.
 */
export function getAvatarFallbackClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "bg-muted text-muted-foreground";

  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }

  return AVATAR_FALLBACK_CLASSES[Math.abs(hash) % AVATAR_FALLBACK_CLASSES.length];
}

export function generateMeta({
  title,
  description,
  canonical
}: {
  title: string;
  description: string;
  canonical: string;
}): Metadata {
  return {
    title: `${title} - Shadcn UI Kit`,
    description: description,
    metadataBase: new URL(`https://shadcnuikit.com`),
    alternates: {
      canonical: `/dashboard${canonical}`
    },
    openGraph: {
      images: [`/images/seo.jpg`]
    }
  };
}

// a function to get the first letter of the first and last name of names
export const getInitials = (fullName: string) => {
  const nameParts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (nameParts.length === 0) return "?";
  if (nameParts.length === 1) return nameParts[0].slice(0, 2).toUpperCase();

  const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
  const lastNameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  return `${firstNameInitial}${lastNameInitial}`;
};

/**
 * Format a number as currency.
 * @param amount - The amount to format
 * @param currency - The currency code (default: MYR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "MYR"
): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
