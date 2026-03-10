/**
 * Listing Inquiry CTA Component
 *
 * Call-to-action for listing inquiries.
 * - Authenticated: Shows inline inquiry form (name, email, phone, message).
 * - Guest: Shows login redirect.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  Phone,
  Heart,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/modules/auth";
import { useCreateInteraction } from "@/modules/interaction";
import { useSaveListing } from "@/modules/account";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const inquirySchema = z.object({
  contactName: z.string().min(2, "Name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email"),
  contactPhone: z.string().optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be at most 1000 characters"),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ListingInquiryCtaProps {
  listing: PublicListingDetail;
}

export function ListingInquiryCta({ listing }: ListingInquiryCtaProps) {
  const { user, isAuthenticated } = useAuth();
  const createInteraction = useCreateInteraction();
  const saveListing = useSaveListing();
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const loginRedirect = `/login?redirect=${encodeURIComponent(`/listings/${listing.slug || listing.id}`)}`;

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      contactName: user?.fullName ?? "",
      contactEmail: user?.email ?? "",
      contactPhone: user?.phone ?? "",
      message: "",
    },
  });

  function onSubmit(values: InquiryFormValues) {
    createInteraction.mutate(
      {
        vendorId: listing.vendorId,
        listingId: listing.id,
        interactionType: "ENQUIRY",
        contactName: values.contactName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone || undefined,
        message: values.message,
        source: "web",
        referrer: typeof window !== "undefined" ? window.location.href : undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Inquiry sent! The seller will get back to you.");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to send inquiry. Please try again.");
        },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="font-medium">Inquiry Sent!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The seller will contact you soon.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Guest view — login prompts
  // ---------------------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Interested?
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            Contact the seller or save this listing to your favourites.
          </p>

          <div className="space-y-2">
            <Button className="w-full rounded-xl" asChild>
              <Link href={loginRedirect}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Inquiry
              </Link>
            </Button>

            {listing.vendor?.phone && (
              <Button variant="outline" className="w-full rounded-xl" asChild>
                <a href={`tel:${listing.vendor.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Seller
                </a>
              </Button>
            )}

            <Button variant="ghost" className="w-full rounded-xl" asChild>
              <Link href={loginRedirect}>
                <Heart className="mr-2 h-4 w-4" />
                Save to Favourites
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sign in to send inquiries and save listings
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Authenticated view — inquiry form
  // ---------------------------------------------------------------------------

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="p-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Send an Inquiry
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+60123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="I'm interested in this property..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={createInteraction.isPending}
            >
              {createInteraction.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              {createInteraction.isPending ? "Sending..." : "Send Inquiry"}
            </Button>
          </form>
        </Form>

        {/* Call Seller */}
        {listing.vendor?.phone && (
          <Button variant="outline" className="mt-3 w-full rounded-xl" asChild>
            <a href={`tel:${listing.vendor.phone}`}>
              <Phone className="mr-2 h-4 w-4" />
              Call Seller
            </a>
          </Button>
        )}

        {/* Save / Favourite */}
        <Button
          variant="ghost"
          className="mt-2 w-full rounded-xl"
          disabled={saveListing.isPending || saved}
          onClick={() =>
            saveListing.mutate(
              { listingId: listing.id },
              {
                onSuccess: () => {
                  setSaved(true);
                  toast.success("Listing saved to favourites!");
                },
                onError: (error) => {
                  toast.error(error.message || "Failed to save listing.");
                },
              }
            )
          }
        >
          <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current text-red-500" : ""}`} />
          {saved ? "Saved" : saveListing.isPending ? "Saving..." : "Save to Favourites"}
        </Button>
      </div>
    </div>
  );
}
