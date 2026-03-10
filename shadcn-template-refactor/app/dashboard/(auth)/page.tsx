import { generateMeta } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RocketIcon, LayoutDashboardIcon, BookOpenIcon, ComponentIcon } from "lucide-react";
import Link from "next/link";

export async function generateMetadata() {
  return generateMeta({
    title: "Dashboard",
    description: "Welcome to your new dashboard. Start building your application.",
    canonical: "/"
  });
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          This is your fresh starting point. Build something amazing!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RocketIcon className="size-5" />
              Getting Started
            </CardTitle>
            <CardDescription>Quick start guide for your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>• Edit this page at <code className="bg-muted rounded px-1">app/dashboard/(auth)/page.tsx</code></li>
              <li>• Customize navigation in <code className="bg-muted rounded px-1">components/layout/sidebar/nav-main.tsx</code></li>
              <li>• Add your components to <code className="bg-muted rounded px-1">components/</code></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ComponentIcon className="size-5" />
              UI Components
            </CardTitle>
            <CardDescription>50+ ready-to-use components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              All shadcn/ui components are available in the <code className="bg-muted rounded px-1">components/ui/</code> folder.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="https://ui.shadcn.com/docs/components" target="_blank">
                View Docs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="size-5" />
              Reference Examples
            </CardTitle>
            <CardDescription>Learn from example dashboards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Check the "Reference Examples" section in the sidebar to explore pre-built dashboards and pages.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reference/default">
                Browse Examples
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboardIcon className="size-5" />
            Your Content Here
          </CardTitle>
          <CardDescription>Start building your dashboard content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-muted flex min-h-50 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground text-sm">Your dashboard widgets and content go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

