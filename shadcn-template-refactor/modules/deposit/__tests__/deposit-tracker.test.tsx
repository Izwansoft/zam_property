/**
 * Unit Tests — DepositTracker
 *
 * Tests deposit list rendering, status badges, lifecycle progress,
 * deductions display, summary card, empty state, compact mode, and loading state.
 *
 * @see modules/deposit/components/deposit-tracker.tsx
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DepositTracker, DepositTrackerSkeleton } from '../components/deposit-tracker';
import { DepositType, DepositStatus } from '../types';
import {
  createDeposit,
  createDepositSummary,
  resetIdCounter,
} from '@/test/factories';

// ---------------------------------------------------------------------------
// Reset ID counter between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// DepositTracker — basic rendering
// ---------------------------------------------------------------------------

describe('DepositTracker — rendering', () => {
  const deposits = [
    createDeposit({
      type: DepositType.SECURITY,
      amount: 5000,
      status: DepositStatus.COLLECTED,
    }),
    createDeposit({
      type: DepositType.UTILITY,
      amount: 500,
      status: DepositStatus.COLLECTED,
    }),
  ];

  it('renders deposit type labels', () => {
    render(<DepositTracker deposits={deposits} />);
    expect(screen.getByText('Security Deposit')).toBeInTheDocument();
    expect(screen.getByText('Utility Deposit')).toBeInTheDocument();
  });

  it('renders deposit amounts formatted with currency', () => {
    render(<DepositTracker deposits={deposits} />);
    // "RM 5,000" may appear as both Amount and Refundable; "RM 500" in utility deposit
    const fiveKElements = screen.getAllByText(/RM\s*5,000/);
    expect(fiveKElements.length).toBeGreaterThanOrEqual(1);
    const fiveHundredElements = screen.getAllByText(/RM\s*500/);
    expect(fiveHundredElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders status labels from config', () => {
    render(<DepositTracker deposits={deposits} />);
    const collectedBadges = screen.getAllByText('Collected');
    expect(collectedBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders lifecycle progress bar', () => {
    render(<DepositTracker deposits={deposits} />);
    // Progress labels are part of the lifecycle bar
    const progressLabels = screen.getAllByText('Pending');
    expect(progressLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Deposit Details" card title', () => {
    render(<DepositTracker deposits={deposits} />);
    expect(screen.getByText('Deposit Details')).toBeInTheDocument();
  });

  it('sorts deposits by type (Security → Utility → Key)', () => {
    const mixed = [
      createDeposit({ type: DepositType.KEY, amount: 100 }),
      createDeposit({ type: DepositType.SECURITY, amount: 5000 }),
      createDeposit({ type: DepositType.UTILITY, amount: 500 }),
    ];
    render(<DepositTracker deposits={mixed} />);

    const labels = screen.getAllByText(/Deposit$/);
    // Order should be: Security Deposit, Utility Deposit, Key Deposit
    expect(labels[0]).toHaveTextContent('Security Deposit');
    expect(labels[1]).toHaveTextContent('Utility Deposit');
    expect(labels[2]).toHaveTextContent('Key Deposit');
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — status variants
// ---------------------------------------------------------------------------

describe('DepositTracker — status variants', () => {
  it('shows "Pending" badge for PENDING deposits', () => {
    const deposits = [createDeposit({ status: DepositStatus.PENDING })];
    render(<DepositTracker deposits={deposits} />);
    // "Pending" label appears both as status badge and lifecycle label
    const labels = screen.getAllByText('Pending');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Held" badge for HELD deposits', () => {
    const deposits = [createDeposit({ status: DepositStatus.HELD })];
    render(<DepositTracker deposits={deposits} />);
    const labels = screen.getAllByText('Held');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Fully Refunded" badge for FULLY_REFUNDED deposits', () => {
    const deposits = [
      createDeposit({
        status: DepositStatus.FULLY_REFUNDED,
        refundedAmount: 5000,
        refundedAt: '2027-01-15T10:00:00.000Z',
      }),
    ];
    render(<DepositTracker deposits={deposits} />);
    const labels = screen.getAllByText('Fully Refunded');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Forfeited" badge for FORFEITED deposits', () => {
    const deposits = [createDeposit({ status: DepositStatus.FORFEITED })];
    render(<DepositTracker deposits={deposits} />);
    const labels = screen.getAllByText('Forfeited');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — deductions
// ---------------------------------------------------------------------------

describe('DepositTracker — deductions', () => {
  it('renders deduction claims list', () => {
    const deposits = [
      createDeposit({
        status: DepositStatus.HELD,
        deductionClaims: [
          {
            description: 'Wall damage repair',
            amount: 500,
            addedAt: '2027-01-10T10:00:00.000Z',
          },
          {
            description: 'Cleaning fee',
            amount: 200,
            addedAt: '2027-01-10T10:00:00.000Z',
          },
        ],
      }),
    ];
    render(<DepositTracker deposits={deposits} />);
    expect(screen.getByText('Wall damage repair')).toBeInTheDocument();
    expect(screen.getByText('Cleaning fee')).toBeInTheDocument();
  });

  it('shows total deductions amount', () => {
    const deposits = [
      createDeposit({
        status: DepositStatus.HELD,
        deductionClaims: [
          { description: 'Repair', amount: 300, addedAt: '2027-01-10T00:00:00.000Z' },
        ],
      }),
    ];
    render(<DepositTracker deposits={deposits} />);
    expect(screen.getByText('Deductions')).toBeInTheDocument();
  });

  it('shows refundable amount for COLLECTED deposits', () => {
    const deposits = [
      createDeposit({
        status: DepositStatus.COLLECTED,
        amount: 5000,
      }),
    ];
    render(<DepositTracker deposits={deposits} />);
    expect(screen.getByText('Refundable')).toBeInTheDocument();
  });

  it('shows refunded amount for PARTIALLY_REFUNDED deposits', () => {
    const deposits = [
      createDeposit({
        status: DepositStatus.PARTIALLY_REFUNDED,
        amount: 5000,
        refundedAmount: 4500,
      }),
    ];
    render(<DepositTracker deposits={deposits} />);
    // "Refunded" appears as both lifecycle label and the data label
    const refundedLabels = screen.getAllByText('Refunded');
    expect(refundedLabels.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — summary card
// ---------------------------------------------------------------------------

describe('DepositTracker — summary', () => {
  const deposits = [createDeposit()];
  const summary = createDepositSummary({
    totalDeposits: 5500,
    totalCollected: 5500,
    totalRefunded: 0,
    totalDeductions: 0,
    totalPending: 0,
  });

  it('renders summary card when showSummary=true', () => {
    render(<DepositTracker deposits={deposits} summary={summary} showSummary />);
    expect(screen.getByText('Deposit Summary')).toBeInTheDocument();
  });

  it('shows total required amount', () => {
    render(<DepositTracker deposits={deposits} summary={summary} showSummary />);
    expect(screen.getByText('Total Required')).toBeInTheDocument();
    // Amount "RM 5,500" appears in both Total Required and Collected, use getAllByText
    const amountElements = screen.getAllByText(/RM\s*5,500/);
    expect(amountElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows collection progress percentage', () => {
    render(<DepositTracker deposits={deposits} summary={summary} showSummary />);
    expect(screen.getByText('Collection Progress')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows pending amount when there are pending deposits', () => {
    const pendingSummary = createDepositSummary({
      totalDeposits: 5500,
      totalCollected: 5000,
      totalPending: 500,
    });
    render(<DepositTracker deposits={deposits} summary={pendingSummary} showSummary />);
    // Use exact match for "RM 500" to avoid matching "5,500" which also contains "500"
    const pendingEl = screen.getByText('RM 500');
    expect(pendingEl).toBeInTheDocument();
  });

  it('hides summary card when showSummary=false', () => {
    render(<DepositTracker deposits={deposits} summary={summary} showSummary={false} />);
    expect(screen.queryByText('Deposit Summary')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — compact mode
// ---------------------------------------------------------------------------

describe('DepositTracker — compact mode', () => {
  const deposits = [
    createDeposit({ type: DepositType.SECURITY, amount: 5000 }),
    createDeposit({ type: DepositType.UTILITY, amount: 500 }),
  ];

  it('renders compact deposit items', () => {
    render(<DepositTracker deposits={deposits} compact />);
    // In compact mode, "Deposits" heading appears
    expect(screen.getByText('Deposits')).toBeInTheDocument();
  });

  it('shows deposit type labels in compact mode', () => {
    render(<DepositTracker deposits={deposits} compact />);
    expect(screen.getByText('Security Deposit')).toBeInTheDocument();
    expect(screen.getByText('Utility Deposit')).toBeInTheDocument();
  });

  it('shows pending collection warning when summary has pending', () => {
    const summary = createDepositSummary({ totalPending: 500 });
    render(
      <DepositTracker
        deposits={deposits}
        summary={summary}
        compact
        showSummary
      />
    );
    expect(screen.getByText('Pending Collection')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — empty state
// ---------------------------------------------------------------------------

describe('DepositTracker — empty state', () => {
  it('renders empty state when no deposits', () => {
    render(<DepositTracker deposits={[]} />);
    expect(screen.getByText('No deposits recorded')).toBeInTheDocument();
  });

  it('renders empty state when deposits is undefined', () => {
    render(<DepositTracker deposits={undefined as any} />);
    expect(screen.getByText('No deposits recorded')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DepositTracker — loading state
// ---------------------------------------------------------------------------

describe('DepositTracker — loading', () => {
  it('renders skeleton when isLoading=true', () => {
    const { container } = render(<DepositTracker deposits={[]} isLoading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders non-compact skeleton by default', () => {
    const { container } = render(<DepositTracker deposits={[]} isLoading />);
    // Non-compact has rounded-lg border items
    const borders = container.querySelectorAll('.rounded-lg.border');
    expect(borders.length).toBeGreaterThan(0);
  });

  it('renders compact skeleton when compact=true', () => {
    const { container } = render(<DepositTracker deposits={[]} isLoading compact />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// DepositTrackerSkeleton — standalone
// ---------------------------------------------------------------------------

describe('DepositTrackerSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<DepositTrackerSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders summary skeleton when showSummary=true', () => {
    const { container } = render(<DepositTrackerSkeleton showSummary />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(3);
  });

  it('renders compact skeleton', () => {
    const { container } = render(<DepositTrackerSkeleton compact />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
