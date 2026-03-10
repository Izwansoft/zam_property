/**
 * Public Pages Layout
 *
 * Layout wrapper for all public pages (home, search, listing detail).
 * Provides header and footer without authentication requirement.
 *
 * @see docs/ai-prompt/part-5.md - Layout Layers (5.2)
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  SearchIcon,
  MenuIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ComparisonBar } from "@/modules/search/components/comparison-bar";
import { ChatWidget } from "@/modules/chat";

// =============================================================================
// Public Header
// =============================================================================

function PublicHeader() {
  return (
    <header className="bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/brand/logo-light.png"
            alt="Zam Property"
            width={200}
            height={48}
            className="h-12 w-auto dark:hidden"
            priority
          />
          <Image
            src="/images/brand/logo-dark.png"
            alt="Zam Property"
            width={200}
            height={48}
            className="hidden h-12 w-auto dark:block"
            priority
          />
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex md:flex-1 md:justify-center md:px-8">
          <div className="relative w-full max-w-lg">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search properties, vehicles, and more..."
              className="w-full pl-9"
            />
          </div>
        </div>

        {/* Desktop Actions */}
        <nav className="hidden items-center space-x-4 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/search">Browse</Link>
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center space-x-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100">
              <nav className="mt-8 flex flex-col space-y-4">
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full pl-9"
                  />
                </div>
                <Link href="/search" className="text-lg font-medium">
                  Browse Listings
                </Link>
                <Link href="/login" className="text-lg font-medium">
                  Sign in
                </Link>
                <Button asChild className="w-full">
                  <Link href="/register">Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// Public Footer
// =============================================================================

function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/images/brand/logo-light.png"
                alt="Zam Property"
                width={150}
                height={40}
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/images/brand/logo-dark.png"
                alt="Zam Property"
                width={150}
                height={40}
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm">
              Malaysia&apos;s leading multi-category marketplace. Buy and sell
              properties, vehicles, electronics, and more with confidence.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Categories</h4>
            <nav className="text-muted-foreground flex flex-col space-y-2 text-sm">
              <Link
                href="/property"
                className="hover:text-foreground transition-colors"
              >
                Real Estate
              </Link>
              <Link
                href="/category/automotive"
                className="hover:text-foreground transition-colors"
              >
                Automotive
              </Link>
              <Link
                href="/category/electronics"
                className="hover:text-foreground transition-colors"
              >
                Electronics
              </Link>
              <Link
                href="/category/jobs"
                className="hover:text-foreground transition-colors"
              >
                Jobs
              </Link>
              <Link
                href="/category/fashion"
                className="hover:text-foreground transition-colors"
              >
                Fashion
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Company</h4>
            <nav className="text-muted-foreground flex flex-col space-y-2 text-sm">
              <Link
                href="/about"
                className="hover:text-foreground transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/register"
                className="hover:text-foreground transition-colors"
              >
                Become a Seller
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact Us</h4>
            <div className="text-muted-foreground flex flex-col space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Level 10, Menara XYZ
                  <br />
                  Kuala Lumpur, Malaysia
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+60 3-1234 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>support@zamproperty.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm sm:flex-row">
          <p>&copy; {currentYear} Lamanniaga Sdn. Bhd. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/cookies"
              className="hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Layout
// =============================================================================

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter />
      <ComparisonBar />
      <ChatWidget />
    </div>
  );
}
