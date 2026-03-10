"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  GridIcon,
  ListIcon,
  SearchIcon,
  XIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, type PageHeaderProps } from "@/components/common/page-header";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewMode = "grid" | "list" | "table";

export interface FilterOption {
  /** Display label */
  label: string;
  /** URL param value */
  value: string;
}

export interface FilterConfig {
  /** URL parameter key */
  key: string;
  /** Display label */
  label: string;
  /** Available options */
  options: FilterOption[];
  /** Placeholder text */
  placeholder?: string;
}

export interface ListPagePagination {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  total: number;
  /** Total pages */
  totalPages: number;
}

export interface SortOption {
  /** Display label */
  label: string;
  /** Sort value (e.g., "createdAt:desc") */
  value: string;
}

export interface ListPageProps
  extends Omit<PageHeaderProps, "children" | "loading"> {
  /** Whether data is loading */
  loading?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether to show the search bar */
  showSearch?: boolean;
  /** Filter configurations */
  filters?: FilterConfig[];
  /** Sort options */
  sortOptions?: SortOption[];
  /** Default sort value */
  defaultSort?: string;
  /** Pagination data */
  pagination?: ListPagePagination;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Whether to show view mode toggle */
  showViewToggle?: boolean;
  /** Default view mode */
  defaultViewMode?: ViewMode;
  /** Current view mode (controlled) */
  viewMode?: ViewMode;
  /** View mode change handler */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Whether the list has any items (used to show empty state) */
  isEmpty?: boolean;
  /** Error state content */
  errorState?: React.ReactNode;
  /** Whether an error occurred */
  hasError?: boolean;
  /** Total results text (e.g., "123 listings") */
  totalLabel?: string;
  /** Children â€” the actual list/table/grid content */
  children: React.ReactNode;
  /** Additional toolbar content (bulk actions, etc.) */
  toolbarExtra?: React.ReactNode;
  /** Custom className for the content area */
  contentClassName?: string;
}

// ---------------------------------------------------------------------------
// URL Helpers
// ---------------------------------------------------------------------------

function useFilterParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getParam = (key: string, defaultValue = "") => {
    return searchParams.get(key) ?? defaultValue;
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  const hasFilters = searchParams.toString().length > 0;

  return { setParam, getParam, clearAll, hasFilters, searchParams };
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SearchBar({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

function FilterSelect({
  config,
  value,
  onChange,
}: {
  config: FilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || "all"} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-40" aria-label={config.label}>
        <SelectValue placeholder={config.placeholder ?? config.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {config.label}</SelectItem>
        {config.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border" role="group" aria-label="View mode">
      <Button
        variant={mode === "grid" ? "secondary" : "ghost"}
        size="icon"
        className="rounded-r-none"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
      >
        <GridIcon className="size-4" aria-hidden="true" />
      </Button>
      <Button
        variant={mode === "list" || mode === "table" ? "secondary" : "ghost"}
        size="icon"
        className="rounded-l-none"
        onClick={() => onChange("table")}
        aria-label="List view"
        aria-pressed={mode === "list" || mode === "table"}
      >
        <ListIcon className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function PaginationControls({
  pagination,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  totalLabel,
}: {
  pagination: ListPagePagination;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
  totalLabel?: string;
}) {
  const { page, totalPages, total, pageSize } = pagination;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav className="flex flex-col items-center justify-between gap-4 border-t px-2 py-4 sm:flex-row" aria-label="Pagination">
      {/* Results info */}
      <p className="text-muted-foreground text-sm">
        {total > 0
          ? `Showing ${start}â€“${end} of ${total.toLocaleString()}${totalLabel ? ` ${totalLabel}` : ""}`
          : "No results"}
      </p>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className="h-8 w-17.5" aria-label="Results per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label="First page"
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>

          <span className="text-sm px-2 min-w-20 text-center">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListPageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading list">
      <span className="sr-only">Loading list content, please wait.</span>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function DefaultEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <div className="bg-muted mb-4 rounded-full p-4">
        <SearchIcon className="text-muted-foreground size-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold">No results found</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Try adjusting your search or filter criteria to find what you&apos;re
        looking for.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ListPage template â€” consistent list/table page layout.
 *
 * Follows Part-5 Â§5.4(A):
 * - Header: title + breadcrumb + primary action(s)
 * - Action bar: search + filter chips + sort
 * - Table/Grid: paginated content
 * - Footer: pagination + total count
 *
 * URL-driven filters per Part-5 Â§5.5 â€” all filter state lives in search params.
 */
export function ListPage({
  // PageHeader props
  title,
  description,
  status,
  icon,
  actions,
  backHref,
  onBack,
  breadcrumbOverrides,
  hideBreadcrumb,
  // ListPage-specific props
  loading = false,
  searchPlaceholder = "Search...",
  showSearch = true,
  filters = [],
  sortOptions = [],
  defaultSort,
  pagination,
  pageSizeOptions = [10, 20, 50, 100],
  showViewToggle = false,
  defaultViewMode = "table",
  viewMode: controlledViewMode,
  onViewModeChange,
  emptyState,
  isEmpty = false,
  errorState,
  hasError = false,
  totalLabel,
  children,
  toolbarExtra,
  contentClassName,
}: ListPageProps) {
  const { setParam, getParam, clearAll, hasFilters } = useFilterParams();
  const [internalViewMode, setInternalViewMode] =
    React.useState<ViewMode>(defaultViewMode);

  const currentViewMode = controlledViewMode ?? internalViewMode;
  const handleViewChange =
    onViewModeChange ??
    ((mode: ViewMode) => setInternalViewMode(mode));

  // Debounced search
  const searchValue = getParam("q");
  const [localSearch, setLocalSearch] = React.useState(searchValue);
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setParam("q", value || null);
    }, 300);
  };

  // Error state
  if (hasError && errorState) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={title}
          description={description}
          status={status}
          icon={icon}
          actions={actions}
          backHref={backHref}
          onBack={onBack}
          breadcrumbOverrides={breadcrumbOverrides}
          hideBreadcrumb={hideBreadcrumb}
        />
        {errorState}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        status={status}
        icon={icon}
        actions={actions}
        backHref={backHref}
        onBack={onBack}
        breadcrumbOverrides={breadcrumbOverrides}
        hideBreadcrumb={hideBreadcrumb}
      />

      {/* Toolbar: Search + Filters + Sort + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          {showSearch && (
            <SearchBar
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={handleSearchChange}
            />
          )}

          {/* Filters */}
          {filters.map((filter) => (
            <FilterSelect
              key={filter.key}
              config={filter}
              value={getParam(filter.key)}
              onChange={(val) => setParam(filter.key, val)}
            />
          ))}

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground"
            >
              <XIcon className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          {sortOptions.length > 0 && (
            <Select
              value={getParam("sort", defaultSort ?? "")}
              onValueChange={(val) => setParam("sort", val)}
            >
              <SelectTrigger className="w-45" aria-label="Sort order">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          {showViewToggle && (
            <ViewToggle mode={currentViewMode} onChange={handleViewChange} />
          )}

          {/* Extra toolbar content */}
          {toolbarExtra}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <ListPageSkeleton />
      ) : isEmpty ? (
        emptyState ?? <DefaultEmptyState />
      ) : (
        <div className={contentClassName}>{children}</div>
      )}

      {/* Pagination */}
      {pagination && !isEmpty && !loading && (
        <PaginationControls
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          totalLabel={totalLabel}
          onPageChange={(p) => setParam("page", String(p))}
          onPageSizeChange={(size) => setParam("pageSize", size)}
        />
      )}
    </div>
  );
}

