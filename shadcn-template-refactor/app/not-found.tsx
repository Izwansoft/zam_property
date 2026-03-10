import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <div className="text-muted-foreground/30 select-none text-[10rem] font-black leading-none tracking-tighter sm:text-[14rem]">
          404
        </div>

        <h1 className="-mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>

        <p className="text-muted-foreground mt-3 max-w-md text-base leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved, deleted, or the URL might be incorrect.
        </p>

        <div className="mt-8 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          If you believe this is an error, please{" "}
          <Link
            href="mailto:support@lamaniaga.com"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
