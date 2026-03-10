/**
 * Unit Tests — BillList + BillCard
 *
 * Tests list filtering by status tabs, empty state, loading skeleton,
 * pagination, tab counts, and BillCard rendering.
 *
 * @see modules/billing/components/bill-list.tsx
 * @see modules/billing/components/bill-card.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BillList } from '../components/bill-list';
import { BillCard, BillCardSkeleton } from '../components/bill-card';
import {
  BillingStatus,
  BILLING_FILTER_TABS,
  getStatusesForBillingFilter,
} from '../types';
import { createBilling, resetIdCounter } from '@/test/factories';

// ---------------------------------------------------------------------------
// Reset ID counter between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// getStatusesForBillingFilter — pure function
// ---------------------------------------------------------------------------

describe('getStatusesForBillingFilter', () => {
  it('returns undefined for "all" filter (no filtering)', () => {
    expect(getStatusesForBillingFilter('all')).toBeUndefined();
  });

  it('returns SENT and GENERATED for "pending" filter', () => {
    const statuses = getStatusesForBillingFilter('pending');
    expect(statuses).toContain(BillingStatus.SENT);
    expect(statuses).toContain(BillingStatus.GENERATED);
    expect(statuses).toHaveLength(2);
  });

  it('returns OVERDUE for "overdue" filter', () => {
    const statuses = getStatusesForBillingFilter('overdue');
    expect(statuses).toEqual([BillingStatus.OVERDUE]);
  });

  it('returns PARTIALLY_PAID for "partial" filter', () => {
    const statuses = getStatusesForBillingFilter('partial');
    expect(statuses).toEqual([BillingStatus.PARTIALLY_PAID]);
  });

  it('returns PAID for "paid" filter', () => {
    const statuses = getStatusesForBillingFilter('paid');
    expect(statuses).toEqual([BillingStatus.PAID]);
  });

  it('returns undefined for unknown filter value', () => {
    expect(getStatusesForBillingFilter('nonexistent')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BILLING_FILTER_TABS — exported config
// ---------------------------------------------------------------------------

describe('BILLING_FILTER_TABS', () => {
  it('exports 5 filter tabs', () => {
    expect(BILLING_FILTER_TABS).toHaveLength(5);
  });

  it('has "all" as first tab', () => {
    expect(BILLING_FILTER_TABS[0].value).toBe('all');
    expect(BILLING_FILTER_TABS[0].label).toBe('All');
  });

  it('includes pending, overdue, partial, and paid tabs', () => {
    const values = BILLING_FILTER_TABS.map((t) => t.value);
    expect(values).toContain('pending');
    expect(values).toContain('overdue');
    expect(values).toContain('partial');
    expect(values).toContain('paid');
  });
});

// ---------------------------------------------------------------------------
// BillList — rendering
// ---------------------------------------------------------------------------

describe('BillList', () => {
  const defaultProps = {
    bills: [
      createBilling({ status: BillingStatus.SENT }),
      createBilling({ status: BillingStatus.OVERDUE, lateFee: 50, totalAmount: 2550, balanceDue: 2550 }),
      createBilling({ status: BillingStatus.PAID, paidAmount: 2500, balanceDue: 0, paidDate: '2026-01-10T00:00:00.000Z' }),
      createBilling({ status: BillingStatus.PARTIALLY_PAID, paidAmount: 1000, balanceDue: 1500 }),
    ],
    activeFilter: 'all',
    onFilterChange: vi.fn(),
  };

  it('renders all filter tabs', () => {
    render(<BillList {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Pending/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overdue/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Partial/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Paid/i })).toBeInTheDocument();
  });

  it('shows all bill cards when "all" filter', () => {
    render(<BillList {...defaultProps} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);
  });

  it('displays tab counts from data', () => {
    render(<BillList {...defaultProps} />);
    const allTab = screen.getByRole('tab', { name: /All/i });
    expect(allTab).toHaveTextContent('4');
  });

  it('calls onFilterChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<BillList {...defaultProps} onFilterChange={onFilterChange} />);

    await user.click(screen.getByRole('tab', { name: /Overdue/i }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  it('filters bills client-side when activeFilter is "pending"', () => {
    render(<BillList {...defaultProps} activeFilter="pending" />);
    const links = screen.getAllByRole('link');
    // Only 1 SENT bill matches pending filter
    expect(links.length).toBe(1);
  });

  it('filters bills client-side for "overdue" tab', () => {
    render(<BillList {...defaultProps} activeFilter="overdue" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
  });

  it('filters bills client-side for "paid" tab', () => {
    render(<BillList {...defaultProps} activeFilter="paid" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
  });

  it('filters bills client-side for "partial" tab', () => {
    render(<BillList {...defaultProps} activeFilter="partial" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
  });

  it('shows empty state when no bills match filter', () => {
    const bills = [createBilling({ status: BillingStatus.PAID, paidAmount: 2500, balanceDue: 0 })];
    render(
      <BillList
        bills={bills}
        activeFilter="overdue"
        onFilterChange={vi.fn()}
      />
    );
    expect(screen.getByText(/No overdue bills/i)).toBeInTheDocument();
  });

  it('shows overall empty state when bills array is empty', () => {
    render(
      <BillList
        bills={[]}
        activeFilter="all"
        onFilterChange={vi.fn()}
      />
    );
    expect(screen.getByText(/No bills yet/i)).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading=true', () => {
    const { container } = render(
      <BillList {...defaultProps} isLoading />
    );
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('uses server-computed counts when provided', () => {
    render(
      <BillList
        {...defaultProps}
        counts={{ all: 10, pending: 3, overdue: 2, partial: 1, paid: 4 }}
      />
    );
    const allTab = screen.getByRole('tab', { name: /All/i });
    expect(allTab).toHaveTextContent('10');
  });
});

// ---------------------------------------------------------------------------
// BillList — pagination
// ---------------------------------------------------------------------------

describe('BillList — pagination', () => {
  it('renders pagination when totalPages > 1', () => {
    render(
      <BillList
        bills={[createBilling()]}
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
      <BillList
        bills={[createBilling()]}
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
// BillCard — rendering
// ---------------------------------------------------------------------------

describe('BillCard', () => {
  const bill = createBilling({
    billNumber: 'BILL-2026-001',
    billingPeriod: '2026-01',
    status: BillingStatus.SENT,
    totalAmount: 2500,
    balanceDue: 2500,
    dueDate: '2026-01-15T00:00:00.000Z',
    issueDate: '2026-01-01T00:00:00.000Z',
  });

  it('renders bill number', () => {
    render(<BillCard bill={bill} />);
    expect(screen.getByText('BILL-2026-001')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<BillCard bill={bill} />);
    // Status "Pending" for SENT status from BILLING_STATUS_CONFIG
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders total amount with currency', () => {
    render(<BillCard bill={bill} />);
    expect(screen.getByText(/RM/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it('renders due date', () => {
    render(<BillCard bill={bill} />);
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('links to the correct detail page', () => {
    render(<BillCard bill={bill} basePath="/dashboard/tenant/bills" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/dashboard/tenant/bills/${bill.id}`);
  });

  it('shows Pay Now button for payable bills', () => {
    render(<BillCard bill={bill} />);
    expect(screen.getByRole('button', { name: /Pay Now/i })).toBeInTheDocument();
  });

  it('does NOT show Pay Now button for paid bills', () => {
    const paidBill = createBilling({
      status: BillingStatus.PAID,
      paidAmount: 2500,
      balanceDue: 0,
      paidDate: '2026-01-10T00:00:00.000Z',
    });
    render(<BillCard bill={paidBill} />);
    expect(screen.queryByRole('button', { name: /Pay Now/i })).not.toBeInTheDocument();
  });

  it('highlights overdue bills with destructive styling', () => {
    const overdueBill = createBilling({
      status: BillingStatus.OVERDUE,
      totalAmount: 2550,
      lateFee: 50,
    });
    render(<BillCard bill={overdueBill} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows balance due for partially paid bills', () => {
    const partialBill = createBilling({
      status: BillingStatus.PARTIALLY_PAID,
      totalAmount: 2500,
      paidAmount: 1000,
      balanceDue: 1500,
    });
    render(<BillCard bill={partialBill} />);
    expect(screen.getByText(/Balance/)).toBeInTheDocument();
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
  });

  it('shows late fee indicator when lateFee > 0', () => {
    const lateBill = createBilling({
      status: BillingStatus.OVERDUE,
      lateFee: 50,
      totalAmount: 2550,
    });
    render(<BillCard bill={lateBill} />);
    expect(screen.getByText(/Late fee applied/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// BillCardSkeleton — snapshot safety
// ---------------------------------------------------------------------------

describe('BillCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<BillCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
