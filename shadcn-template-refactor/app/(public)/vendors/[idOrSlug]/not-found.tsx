/**
 * Public Vendor Profile - Not Found
 */

import Link from "next/link";
import { UserX, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VendorNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
      <Card className="w-full text-center">
        <CardContent className="space-y-4 py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Vendor Not Found</h2>
            <p className="text-muted-foreground">
              The vendor profile you&apos;re looking for may have been
              removed or doesn&apos;t exist.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link href="/search">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Listings
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
