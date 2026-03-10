/**
 * Unit Tests — TenancyList + TenancyCard
 *
 * Tests list filtering by status tabs, empty state, loading skeleton,
 * pagination, and TenancyCard rendering (status badge, address, rent).
 *
 * @see modules/tenancy/components/tenancy-list.tsx
 * @see modules/tenancy/components/tenancy-card.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TenancyList, TENANCY_FILTER_TABS, getStatusesForFilter } from '../components/tenancy-list';
import { TenancyCard, TenancyCardSkeleton } from '../components/tenancy-card';
import { TenancyStatus } from '../types';
import { createTenancy, resetIdCounter } from '@/test/factories';

// ---------------------------------------------------------------------------
// Reset ID counter between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// getStatusesForFilter — pure function
// ---------------------------------------------------------------------------

describe('getStatusesForFilter', () => {
  it('returns undefined for "all" filter (no filtering)', () => {
    expect(getStatusesForFilter('all')).toBeUndefined();
  });

  it('returns active + approved for "active" filter', () => {
    const statuses = getStatusesForFilter('active');
    expect(statuses).toContain('ACTIVE');
    expect(statuses).toContain('APPROVED');
    expect(statuses).toHaveLength(2);
  });

  it('returns pending statuses for "pending" filter', () => {
    const statuses = getStatusesForFilter('pending');
    expect(statuses).toContain('PENDING_BOOKING');
    expect(statuses).toContain('PENDING_CONTRACT');
    expect(statuses).toContain('PENDING_SIGNATURES');
    expect(statuses).toHaveLength(3);
  });

  it('returns overdue for "overdue" filter', () => {
    const statuses = getStatusesForFilter('overdue');
    expect(statuses).toEqual(['OVERDUE']);
  });

  it('returns past statuses for "terminated" filter', () => {
    const statuses = getStatusesForFilter('terminated');
    expect(statuses).toContain('TERMINATED');
    expect(statuses).toContain('CANCELLED');
    expect(statuses).toContain('TERMINATING');
    expect(statuses).toContain('TERMINATION_REQUESTED');
  });

  it('returns undefined for unknown filter value', () => {
    expect(getStatusesForFilter('nonexistent')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TENANCY_FILTER_TABS — exported config
// ---------------------------------------------------------------------------

describe('TENANCY_FILTER_TABS', () => {
  it('exports 5 filter tabs', () => {
    expect(TENANCY_FILTER_TABS).toHaveLength(5);
  });

  it('has "all" as first tab', () => {
    expect(TENANCY_FILTER_TABS[0].value).toBe('all');
    expect(TENANCY_FILTER_TABS[0].label).toBe('All');
  });
});

// ---------------------------------------------------------------------------
// TenancyList — rendering
// ---------------------------------------------------------------------------

describe('TenancyList', () => {
  const defaultProps = {
    tenancies: [
      createTenancy({ status: TenancyStatus.ACTIVE }),
      createTenancy({ status: TenancyStatus.PENDING_BOOKING }),
      createTenancy({ status: TenancyStatus.TERMINATED }),
    ],
    activeFilter: 'all',
    onFilterChange: vi.fn(),
  };

  it('renders all filter tabs', () => {
    render(<TenancyList {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Active/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Pending/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overdue/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Past/i })).toBeInTheDocument();
  });

  it('shows all tenancy cards when "all" filter', () => {
    render(<TenancyList {...defaultProps} />);
    // All 3 tenancies should render as links
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
  });

  it('displays tab counts', () => {
    render(<TenancyList {...defaultProps} />);
    // "All" tab should show count 3
    const allTab = screen.getByRole('tab', { name: /All/i });
    expect(allTab).toHaveTextContent('3');
  });

  it('calls onFilterChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<TenancyList {...defaultProps} onFilterChange={onFilterChange} />);

    await user.click(screen.getByRole('tab', { name: /Active/i }));
    expect(onFilterChange).toHaveBeenCalledWith('active');
  });

  it('filters tenancies client-side when activeFilter is "active"', () => {
    render(<TenancyList {...defaultProps} activeFilter="active" />);
    // Only 1 ACTIVE tenancy should show (APPROVED would also show but we have none)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
  });

  it('shows empty state when no tenancies match filter', () => {
    render(<TenancyList {...defaultProps} activeFilter="overdue" />);
    expect(screen.getByText(/No overdue tenancies/i)).toBeInTheDocument();
  });

  it('shows overall empty state when tenancies array is empty', () => {
    render(
      <TenancyList
        tenancies={[]}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    expect(screen.getByText(/No tenancies yet/i)).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading=true', () => {
    const { container } = render(
      <TenancyList {...defaultProps} isLoading />
    );
    // Skeletons should render (3 skeletons)
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TenancyList — pagination
// ---------------------------------------------------------------------------

describe('TenancyList — pagination', () => {
  it('renders pagination when totalPages > 1', () => {
    render(
      <TenancyList
        tenancies={[createTenancy()]}
        activeFilter="all"
        onFilterChange={vi.fn()}
        pagination={{ page: 1, pageSize: 10, total: 25, totalPages: 3 }}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('does not render pagination when totalPages <= 1', () => {
    render(
      <TenancyList
        tenancies={[createTenancy()]}
        activeFilter="all"
        onFilterChange={vi.fn()}
        pagination={{ page: 1, pageSize: 10, total: 5, totalPages: 1 }}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TenancyCard — rendering
// ---------------------------------------------------------------------------

describe('TenancyCard', () => {
  const tenancy = createTenancy({
    status: TenancyStatus.ACTIVE,
    monthlyRent: 2500,
    currency: 'MYR',
    property: {
      id: 'prop-001',
      title: 'Sunny Condo Unit A-12-3',
      address: '123 Jalan Ampang',
      city: 'Kuala Lumpur',
      state: 'Selangor',
      thumbnailUrl: '/images/condo.jpg',
      propertyType: 'Condominium',
      bedrooms: 3,
      bathrooms: 2,
    },
    unit: { id: 'unit-001', unitNumber: 'A-12-3', floor: 12, block: 'A' },
    owner: { id: 'owner-001', name: 'Ahmad Abdullah' },
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2027-01-01T00:00:00.000Z',
  });

  it('renders property title', () => {
    render(<TenancyCard tenancy={tenancy} />);
    expect(screen.getByText('Sunny Condo Unit A-12-3')).toBeInTheDocument();
  });

  it('renders status badge with correct label', () => {
    render(<TenancyCard tenancy={tenancy} />);
    // Status badge renders twice (mobile + desktop), at least one visible
    const badges = screen.getAllByText('Active');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders unit info', () => {
    render(<TenancyCard tenancy={tenancy} />);
    // Unit info is in a <p> that contains unit number, floor, block
    const unitTexts = screen.getAllByText(/A-12-3/);
    expect(unitTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Floor 12/)).toBeInTheDocument();
    expect(screen.getByText(/Block A/)).toBeInTheDocument();
  });

  it('renders address', () => {
    render(<TenancyCard tenancy={tenancy} />);
    expect(screen.getByText(/123 Jalan Ampang, Kuala Lumpur, Selangor/)).toBeInTheDocument();
  });

  it('renders bedroom and bathroom counts', () => {
    render(<TenancyCard tenancy={tenancy} />);
    expect(screen.getByText(/3 Beds/)).toBeInTheDocument();
    expect(screen.getByText(/2 Baths/)).toBeInTheDocument();
  });

  it('renders monthly rent formatted with currency', () => {
    render(<TenancyCard tenancy={tenancy} />);
    // Intl.NumberFormat for en-MY with MYR → "RM 2,500" or "RM2,500"
    expect(screen.getByText(/RM/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it('renders owner name', () => {
    render(<TenancyCard tenancy={tenancy} />);
    expect(screen.getByText(/Ahmad Abdullah/)).toBeInTheDocument();
  });

  it('links to the correct detail page', () => {
    render(<TenancyCard tenancy={tenancy} basePath="/dashboard/tenant/tenancy" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dashboard/tenant/tenancy/${tenancy.id}`);
  });

  it('renders different status badges correctly', () => {
    const overdueT = createTenancy({ status: TenancyStatus.OVERDUE });
    render(<TenancyCard tenancy={overdueT} />);
    const badges = screen.getAllByText('Overdue');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('handles tenancy without unit gracefully', () => {
    const noUnit = createTenancy({ unit: undefined });
    render(<TenancyCard tenancy={noUnit} />);
    // The unit paragraph ("Unit X, Floor Y, Block Z") should not appear
    // But the property title might contain "Unit", so check for the floor/block pattern instead
    expect(screen.queryByText(/Floor \d+/)).not.toBeInTheDocument();
  });

  it('handles tenancy without thumbnail gracefully', () => {
    const noThumb = createTenancy({
      property: {
        id: 'prop-002',
        title: 'Basic Unit',
        address: '456 Jalan Test',
        thumbnailUrl: undefined,
      },
    });
    render(<TenancyCard tenancy={noThumb} />);
    // Should render without error; no img element
    expect(screen.getByText('Basic Unit')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TenancyCardSkeleton — snapshot safety
// ---------------------------------------------------------------------------

describe('TenancyCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<TenancyCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
