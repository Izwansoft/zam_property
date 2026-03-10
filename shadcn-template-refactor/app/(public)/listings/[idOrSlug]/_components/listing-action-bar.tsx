/**
 * Listing Action Bar — Share, Print, Report
 *
 * Client component providing share (native + copy link + socials),
 * print, and report buttons for the public listing detail page.
 */

"use client";

import { useState } from "react";
import {
  Share2,
  Printer,
  Flag,
  Copy,
  Check,
  Facebook,
  Twitter,
  Mail,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CompareButton } from "@/modules/search/components/compare-button";
import type { ComparisonItem } from "@/modules/search/store/comparison-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingActionBarProps {
  listingTitle: string;
  listingUrl?: string;
  /** Optional: comparison item data for the Compare button */
  comparisonItem?: ComparisonItem;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingActionBar({
  listingTitle,
  listingUrl,
  comparisonItem,
}: ListingActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const url =
    listingUrl ??
    (typeof window !== "undefined" ? window.location.href : "");

  const encodedTitle = encodeURIComponent(listingTitle);
  const encodedUrl = encodeURIComponent(url);

  // ── Share helpers ────────────────────────────────────────────────
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: listingTitle, url });
      } catch {
        // User cancelled — ignore
      }
    } else {
      handleCopyLink();
    }
  }

  // ── Print ────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ── Report ───────────────────────────────────────────────────────
  function handleReportSubmit() {
    // TODO: Wire to backend report endpoint when available
    setReportSubmitted(true);
    toast.success("Report submitted. Thank you for your feedback.");
    setTimeout(() => {
      setReportOpen(false);
      setReportReason("");
      setReportSubmitted(false);
    }, 1500);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Compare */}
        {comparisonItem && (
          <CompareButton item={comparisonItem} showLabel />
        )}

        {/* Share dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {typeof navigator !== "undefined" && "share" in navigator && (
              <>
                <DropdownMenuItem onClick={handleNativeShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleCopyLink}>
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter / X
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* WhatsApp icon — using Mail as proxy, could swap for custom SVG */}
                <Mail className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Print */}
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>

        {/* Report */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="text-muted-foreground"
        >
          <Flag className="mr-2 h-4 w-4" />
          Report
        </Button>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              Let us know if something is wrong with this listing.
            </DialogDescription>
          </DialogHeader>

          {reportSubmitted ? (
            <div className="py-6 text-center">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="font-medium">Thank you!</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll review your report.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label htmlFor="report-reason">Reason</Label>
                <Textarea
                  id="report-reason"
                  placeholder="e.g., Incorrect information, spam, duplicate listing…"
                  rows={4}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReportOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReportSubmit}
                  disabled={reportReason.trim().length < 5}
                >
                  Submit Report
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
