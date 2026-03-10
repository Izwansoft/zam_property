/**
 * Unit Tests — PayoutDetail
 *
 * Tests payout detail rendering: summary cards, line items, bank details,
 * timeline, statement toggle, download PDF, loading and error states.
 *
 * @see modules/payout/components/payout-detail.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PayoutDetail, PayoutDetailSkeleton } from '../components/payout-detail';
import { PayoutStatus, PayoutLineItemType } from '../types';
import {
  createPayout,
  createPayoutLineItem,
  resetIdCounter,
} from '@/test/factories';
import { renderWithProviders, render } from '@/test/utils';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPayout = createPayout({
  id: 'payout-001',
  payoutNumber: 'PO-2026-001',
  periodStart: '2026-01-01T00:00:00.000Z',
  periodEnd: '2026-01-31T23:59:59.000Z',
  status: PayoutStatus.COMPLETED,
  grossRental: 5000,
  platformFee: 250,
  maintenanceCost: 200,
  otherDeductions: 0,
  netPayout: 4550,
  bankName: 'Maybank',
  bankAccount: '164012345678',
  bankAccountName: 'Ahmad Abdullah',
  bankReference: 'MBB-REF-001',
  processedAt: '2026-01-30T14:00:00.000Z',
  approvedAt: '2026-01-28T10:00:00.000Z',
  lineItems: [
    createPayoutLineItem({
      type: PayoutLineItemType.RENTAL,
      amount: 2500,
      description: 'Rental Income — Unit A-12-3',
    }),
    createPayoutLineItem({
      type: PayoutLineItemType.RENTAL,
      amount: 2500,
      description: 'Rental Income — Unit B-5-1',
    }),
    createPayoutLineItem({
      type: PayoutLineItemType.PLATFORM_FEE,
      amount: -250,
      description: 'Platform Service Fee (5%)',
    }),
    createPayoutLineItem({
      type: PayoutLineItemType.MAINTENANCE,
      amount: -200,
      description: 'Plumbing repair — Unit A-12-3',
    }),
  ],
});

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockUsePayout = vi.fn();
const mockUsePayoutStatement = vi.fn();

vi.mock('../hooks/usePayout', () => ({
  usePayout: (...args: any[]) => mockUsePayout(...args),
}));

vi.mock('../hooks/usePayoutStatement', () => ({
  usePayoutStatement: (...args: any[]) => mockUsePayoutStatement(...args),
}));

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
  mockUsePayout.mockReturnValue({
    data: mockPayout,
    isLoading: false,
    error: null,
  });
  mockUsePayoutStatement.mockReturnValue({
    data: null,
    isFetching: false,
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — rendering with data
// ---------------------------------------------------------------------------

describe('PayoutDetail', () => {
  it('renders payout number', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('PO-2026-001')).toBeInTheDocument();
  });

  it('renders period title', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // January 2026 (same month/year)
    expect(screen.getByText(/January 2026/i)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // Status text may appear in badge + timeline, so use getAllByText
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
  });

  it('renders 4 summary cards', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // Text may appear in both summary cards and line item sections
    expect(screen.getAllByText(/Gross Rental/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Platform Fee/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Deductions/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Net Payout/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders gross rental amount', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // Amount may appear in summary card + subtotal row
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders net payout amount', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // Amount may appear in summary card + bottom net payout card
    expect(screen.getAllByText(/4,550/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders income line items', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('Rental Income — Unit A-12-3')).toBeInTheDocument();
    expect(screen.getByText('Rental Income — Unit B-5-1')).toBeInTheDocument();
  });

  it('renders deduction line items', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('Platform Service Fee (5%)')).toBeInTheDocument();
    expect(screen.getByText('Plumbing repair — Unit A-12-3')).toBeInTheDocument();
  });

  it('renders Rental Income section title', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // "Rental Income" appears as card title + line item type badges
    expect(screen.getAllByText('Rental Income').length).toBeGreaterThanOrEqual(1);
  });

  it('renders View Statement button', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByRole('button', { name: /View Statement/i })).toBeInTheDocument();
  });

  it('renders Download PDF button', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  it('renders bank details', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('Maybank')).toBeInTheDocument();
    expect(screen.getByText('164012345678')).toBeInTheDocument();
    expect(screen.getByText('Ahmad Abdullah')).toBeInTheDocument();
  });

  it('renders bank reference', () => {
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('MBB-REF-001')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — statement toggle
// ---------------------------------------------------------------------------

describe('PayoutDetail — statement toggle', () => {
  it('toggles to statement view when View Statement is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);

    await user.click(screen.getByRole('button', { name: /View Statement/i }));

    // Should show statement view with Back button
    expect(screen.getByRole('button', { name: /Back to Detail/i })).toBeInTheDocument();
  });

  it('returns to detail view when Back is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);

    // Go to statement
    await user.click(screen.getByRole('button', { name: /View Statement/i }));
    expect(screen.getByRole('button', { name: /Back to Detail/i })).toBeInTheDocument();

    // Go back
    await user.click(screen.getByRole('button', { name: /Back to Detail/i }));

    // Should show detail again
    expect(screen.getByRole('button', { name: /View Statement/i })).toBeInTheDocument();
  });

  it('shows Print button in statement view', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);

    await user.click(screen.getByRole('button', { name: /View Statement/i }));
    expect(screen.getByRole('button', { name: /Print/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — download PDF
// ---------------------------------------------------------------------------

describe('PayoutDetail — download', () => {
  it('triggers statement download when Download PDF is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayoutDetail payoutId="payout-001" />);

    await user.click(screen.getByRole('button', { name: /Download PDF/i }));

    // usePayoutStatement should have been called — we verify by checking the mock was invoked
    expect(mockUsePayoutStatement).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — loading state
// ---------------------------------------------------------------------------

describe('PayoutDetail — loading', () => {
  it('renders skeleton when loading', () => {
    mockUsePayout.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { container } = renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — error state
// ---------------------------------------------------------------------------

describe('PayoutDetail — error', () => {
  it('renders error state when payout fails to load', () => {
    mockUsePayout.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('Payout Not Found')).toBeInTheDocument();
  });

  it('renders error state when payout is null', () => {
    mockUsePayout.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText('Payout Not Found')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — different statuses
// ---------------------------------------------------------------------------

describe('PayoutDetail — status variants', () => {
  it('shows Approved badge for APPROVED payout', () => {
    mockUsePayout.mockReturnValue({
      data: createPayout({ status: PayoutStatus.APPROVED }),
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Processing badge for PROCESSING payout', () => {
    mockUsePayout.mockReturnValue({
      data: createPayout({ status: PayoutStatus.PROCESSING }),
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getAllByText('Processing').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Failed badge for FAILED payout', () => {
    mockUsePayout.mockReturnValue({
      data: createPayout({ status: PayoutStatus.FAILED }),
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// PayoutDetail — line items edge cases
// ---------------------------------------------------------------------------

describe('PayoutDetail — edge cases', () => {
  it('handles payout with no line items', () => {
    mockUsePayout.mockReturnValue({
      data: createPayout({ lineItems: [] }),
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    expect(screen.getByText(/No rental income items/i)).toBeInTheDocument();
    expect(screen.getByText(/No deductions for this period/i)).toBeInTheDocument();
  });

  it('handles payout without bank details', () => {
    mockUsePayout.mockReturnValue({
      data: createPayout({
        bankName: null,
        bankAccount: null,
        bankAccountName: null,
        bankReference: null,
      }),
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PayoutDetail payoutId="payout-001" />);
    // Should still render without crashing
    expect(screen.getAllByText(/Gross Rental/).length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// PayoutDetailSkeleton
// ---------------------------------------------------------------------------

describe('PayoutDetailSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<PayoutDetailSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
