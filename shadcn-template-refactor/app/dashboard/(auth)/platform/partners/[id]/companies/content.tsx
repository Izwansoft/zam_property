// =============================================================================
// Partner Companies Sub-page — DataTable with filters, export, print
// =============================================================================
// Shows companies scoped to this partner.
// Backend: GET /api/v1/companies (scoped via X-Partner-ID header)
// =============================================================================

"use client";

import * as React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Pencil, Ban, ShieldCheck } from "lucide-react";
import { showInfo } from "@/lib/errors/toast-helpers";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { EditCompanyDialog } from "@/modules/company/components/edit-company-dialog";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import {
  useVerticalContextStore,
  getVerticalDisplayName,
} from "@/modules/vertical";
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { formatRelativeDate } from "@/modules/listing";
import type { Company } from "@/modules/company/types";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";
import {
  CompanyType,
  CompanyStatus,
  COMPANY_TYPE_CONFIG,
  COMPANY_STATUS_CONFIG,
} from "@/modules/company/types";

// ---------------------------------------------------------------------------
// Hook: admin-scoped company list for a partner
// ---------------------------------------------------------------------------

function usePartnerCompanies(partnerScope?: string, verticalType?: string | null) {
  const params: Record<string, unknown> = { page: 1, limit: 100 };
  if (verticalType) params.verticalType = verticalType;

  return useApiPaginatedQuery<Company>({
    queryKey: queryKeys.companies.list(partnerScope ?? "__partner_scope_pending__", { page: 1, pageSize: 100, verticalType: verticalType ?? undefined }),
    path: "/companies",
    params,
    partnerScope,
    format: "A",
    enabled: !!partnerScope,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<Company, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const company = row.original;
      return (
        <div className="flex items-center gap-3 max-w-72">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className={cn("text-xs font-semibold", getAvatarFallbackClass(company.name))}>
              {getInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{company.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {company.registrationNo}
            </p>
          </div>
        </div>
      );
    },
    filterFn: (row, _id, value) =>
      (row.getValue("name") as string)
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as CompanyType;
      const config = COMPANY_TYPE_CONFIG[type];
      return (
        <Badge variant="outline" className="text-xs">
          {config?.label ?? type}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id)),
  },
  {
    id: "verticalTypes",
    accessorFn: (row) => row.verticalTypes ?? [],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verticals" />
    ),
    cell: ({ row }) => {
      const verticals = (row.original.verticalTypes ?? []) as string[];
      if (verticals.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {verticals.map((v) => (
            <Badge key={v} variant="secondary" className="text-xs">
              {getVerticalDisplayName(v)}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as CompanyStatus;
      const config = COMPANY_STATUS_CONFIG[status];
      return (
        <Badge variant={(config?.variant ?? "outline") as "default"}>
          {config?.label ?? status}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("email")}
      </span>
    ),
  },
  {
    id: "admins",
    accessorFn: (row) => row.admins?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Admins" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.getValue("admins")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted Filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "status",
    title: "Status",
    options: Object.entries(COMPANY_STATUS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
  {
    columnId: "type",
    title: "Type",
    options: Object.entries(COMPANY_TYPE_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
];

const exportColumns: Record<string, string> = {
  name: "Company Name",
  registrationNo: "Registration No.",
  type: "Type",
  status: "Status",
  email: "Email",
  admins: "Admins",
  createdAt: "Registered",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerCompaniesContent() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const router = useRouter();

  const { data: partner } = usePartnerDetail(partnerId);
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);
  const partnerScope = partner?.slug;
  const { data, isLoading, error } = usePartnerCompanies(partnerScope, selectedVertical);

  // Mutation hooks (inline — existing hooks take companyId at creation, not suitable for table context)
  const verifyCompany = useApiMutation<unknown, string>({
    path: (id) => `/companies/${id}/verify`,
    method: "POST",
    invalidateKeys: [queryKeys.companies.all(partnerId)],
  });
  const suspendCompany = useApiMutation<unknown, string>({
    path: (id) => `/companies/${id}/suspend`,
    method: "POST",
    invalidateKeys: [queryKeys.companies.all(partnerId)],
  });

  // Dialog state
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "verify" | "suspend";
    company: Company;
  } | null>(null);

  const companies = React.useMemo(
    () => (data?.items ?? []) as Company[],
    [data?.items],
  );

  if (!partner) return null;

  const displayVertical = selectedVertical
    ? getVerticalDisplayName(selectedVertical)
    : null;

  return (
    <div className="space-y-6">
      <PartnerDetailHeader
        partner={partner}
        basePath="/dashboard/platform/partners"
      />

      <PartnerDetailTabs partnerId={partnerId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Partner Companies
            {displayVertical && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {displayVertical}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedVertical
              ? `Showing ${displayVertical} companies for this partner.`
              : "All companies registered under this partner."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load companies. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={companies}
              isLoading={isLoading}
              enableRowSelection
              searchPlaceholder="Search companies by name..."
              searchColumnId="name"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName={`partner-companies-${partnerId.slice(0, 8)}`}
              exportColumns={exportColumns}
              enablePrint
              pageSize={25}
              emptyMessage="No companies found for this partner."
              rowActions={(company) => [
                {
                  label: "View company",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/companies/${company.id}`),
                },
                {
                  label: "Edit company",
                  icon: Pencil,
                  onClick: () => setEditCompany(company),
                },
                { type: "separator" as const },
                {
                  label: "Verify",
                  icon: ShieldCheck,
                  onClick: () => setConfirmAction({ type: "verify", company }),
                  hidden: company.status !== CompanyStatus.PENDING,
                },
                {
                  label: "Suspend",
                  icon: Ban,
                  onClick: () => setConfirmAction({ type: "suspend", company }),
                  variant: "destructive" as const,
                  hidden: company.status === CompanyStatus.SUSPENDED,
                },
              ]}
              onRowClick={(company) => router.push(`/dashboard/platform/partners/${partnerId}/companies/${company.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      {editCompany && (
        <EditCompanyDialog
          company={editCompany}
          open={!!editCompany}
          onOpenChange={(open) => !open && setEditCompany(null)}
        />
      )}

      {/* Verify Company */}
      <ConfirmActionDialog
        open={confirmAction?.type === "verify"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Verify Company"
        description={`Verify "${confirmAction?.company.name}"? This will mark the company as verified.`}
        confirmLabel="Verify"
        isPending={verifyCompany.isPending}
        onConfirm={() =>
          verifyCompany.mutate(confirmAction!.company.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />

      {/* Suspend Company */}
      <ConfirmActionDialog
        open={confirmAction?.type === "suspend"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Suspend Company"
        description={`Suspend "${confirmAction?.company.name}"? All operations will be paused.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        isPending={suspendCompany.isPending}
        onConfirm={() =>
          suspendCompany.mutate(confirmAction!.company.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />
    </div>
  );
}
