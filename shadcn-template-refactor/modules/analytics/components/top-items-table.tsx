// =============================================================================
// TopItemsTable — Ranked table for top-performing items
// =============================================================================
// Displays top listings/vendors by a chosen metric (views, leads, etc.).
// Used in analytics dashboards.
// =============================================================================

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopItem } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopItemsTableProps {
  title: string;
  description?: string;
  items: TopItem[];
  /** Column definitions: key → human-friendly header label */
  columns: Record<string, string>;
  /** Maximum items to show (default: 5) */
  limit?: number;
  isLoading?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TopItemsTable({
  title,
  description,
  items,
  columns,
  limit = 5,
  isLoading = false,
  className,
}: TopItemsTableProps) {
  const columnKeys = Object.keys(columns);
  const displayItems = items.slice(0, limit);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
            No data yet for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Name</TableHead>
              {columnKeys.map((key) => (
                <TableHead key={key} className="text-right">
                  {columns[key]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {idx + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {item.subLabel && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.subLabel}
                      </span>
                    )}
                  </div>
                </TableCell>
                {columnKeys.map((key) => (
                  <TableCell key={key} className="text-right font-mono">
                    {new Intl.NumberFormat("en-MY").format(
                      item.metrics[key] ?? 0
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
