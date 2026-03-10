"use client";

import { useMemo } from "react";
import { BarChart3, CircleDollarSign, ClipboardCheck, FileText } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCommissions } from "@/modules/commission/hooks/useCommissions";
import { useListings } from "@/modules/listing/hooks/use-listings";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AgentPerformanceContent() {
  const { data: listingsData, isLoading: listingsLoading } = useListings({
    page: 1,
    pageSize: 100,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const { data: commissionsData, isLoading: commissionsLoading } = useCommissions({
    page: 1,
    limit: 50,
    sortBy: "updatedAt",
    sortDir: "desc",
  });

  const listings = listingsData?.items ?? [];
  const commissions = commissionsData?.items ?? [];

  const stats = useMemo(() => {
    const totalListings = listings.length;
    const published = listings.filter((listing) => listing.status === "PUBLISHED").length;
    const draft = listings.filter((listing) => listing.status === "DRAFT").length;
    const archivedOrExpired = listings.filter(
      (listing) => listing.status === "ARCHIVED" || listing.status === "EXPIRED",
    ).length;

    const paidAmount = commissions
      .filter((commission) => commission.status === "PAID")
      .reduce((sum, commission) => sum + commission.amount, 0);
    const pendingAmount = commissions
      .filter((commission) => commission.status === "PENDING")
      .reduce((sum, commission) => sum + commission.amount, 0);

    const approvalRate = totalListings > 0 ? Math.round((published / totalListings) * 100) : 0;

    return {
      totalListings,
      published,
      draft,
      archivedOrExpired,
      paidAmount,
      pendingAmount,
      approvalRate,
    };
  }, [commissions, listings]);

  const loading = listingsLoading || commissionsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Live snapshot of listing outcomes and commission momentum."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <FileText className="size-5 text-muted-foreground" />
              {loading ? "-" : stats.totalListings}
            </div>
            <p className="text-xs text-muted-foreground">{loading ? "" : `${stats.published} published`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <ClipboardCheck className="size-5 text-muted-foreground" />
              {loading ? "-" : `${stats.approvalRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">Draft to published conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paid Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <CircleDollarSign className="size-5 text-muted-foreground" />
              {loading ? "-" : formatCurrency(stats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Captured earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Commissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <BarChart3 className="size-5 text-muted-foreground" />
              {loading ? "-" : formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Listing Status Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Badge variant="default">Published</Badge>
                  </TableCell>
                  <TableCell className="text-right">{loading ? "-" : stats.published}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge variant="outline">Draft</Badge>
                  </TableCell>
                  <TableCell className="text-right">{loading ? "-" : stats.draft}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge variant="secondary">Archived / Expired</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {loading ? "-" : stats.archivedOrExpired}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loading ? [] : commissions.slice(0, 5)).map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{commission.type}</TableCell>
                    <TableCell>
                      <Badge variant={commission.status === "PAID" ? "secondary" : "outline"}>
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(commission.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
