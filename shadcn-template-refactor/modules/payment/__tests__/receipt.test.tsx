/**
 * Unit Tests — ReceiptViewer
 *
 * Tests receipt rendering with payment details, status badge,
 * property info, print button, and skeleton loading state.
 *
 * @see modules/payment/components/receipt.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReceiptViewer, ReceiptViewerSkeleton } from '../components/receipt';
import { PaymentStatus, PaymentMethod } from '../types';
import { createPayment, resetIdCounter } from '@/test/factories';

// ---------------------------------------------------------------------------
// Mock child components that may have complex dependencies
// ---------------------------------------------------------------------------

vi.mock('../components/receipt-download', () => ({
  ReceiptDownload: ({ payment, className }: any) => (
    <button data-testid="receipt-download" className={className}>
      Download PDF
    </button>
  ),
}));

vi.mock('@/components/common/page-header', () => ({
  PageHeader: ({ title, description }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// ReceiptViewer — rendering
// ---------------------------------------------------------------------------

describe('ReceiptViewer', () => {
  const payment = createPayment({
    paymentNumber: 'PAY-2026-001',
    receiptNumber: 'RCP-2026-001',
    amount: 2500,
    currency: 'MYR',
    status: PaymentStatus.COMPLETED,
    method: PaymentMethod.CARD,
    reference: 'TXN-REF-123456',
    paymentDate: '2026-01-10T14:30:00.000Z',
    processedAt: '2026-01-10T14:30:05.000Z',
  });

  const defaultProps = {
    payment,
    billNumber: 'BILL-2026-001',
    propertyName: 'Sunny Condo Unit A-12-3',
    payerName: 'Sarah Tan',
  };

  it('renders "Payment Receipt" title', () => {
    render(<ReceiptViewer {...defaultProps} />);
    // Appears in both PageHeader and receipt card h1
    expect(screen.getAllByText('Payment Receipt').length).toBeGreaterThanOrEqual(1);
  });

  it('renders receipt number', () => {
    render(<ReceiptViewer {...defaultProps} />);
    // Receipt number may appear in PageHeader description and receipt details
    expect(screen.getAllByText('RCP-2026-001').length).toBeGreaterThanOrEqual(1);
  });

  it('renders payment number', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('PAY-2026-001')).toBeInTheDocument();
  });

  it('renders payment amount with currency', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText(/RM/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it('renders "Paid" status badge for completed payment', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders payment method', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
  });

  it('renders transaction reference', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('TXN-REF-123456')).toBeInTheDocument();
  });

  it('renders bill reference when provided', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('BILL-2026-001')).toBeInTheDocument();
  });

  it('renders property name when provided', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('Sunny Condo Unit A-12-3')).toBeInTheDocument();
  });

  it('renders payer name when provided', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText('Sarah Tan')).toBeInTheDocument();
  });

  it('renders payment date', () => {
    render(<ReceiptViewer {...defaultProps} />);
    // Date may appear in multiple formats
    expect(screen.getAllByText(/January/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders computer-generated disclaimer', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText(/computer-generated receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/No signature is required/i)).toBeInTheDocument();
  });

  it('renders Print button', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Print/i })).toBeInTheDocument();
  });

  it('renders Download PDF button', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByTestId('receipt-download')).toBeInTheDocument();
  });

  it('calls window.print when print button is clicked', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ReceiptViewer {...defaultProps} />);

    const printBtn = screen.getByRole('button', { name: /Print/i });
    await user.click(printBtn);

    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });

  it('renders company name "Zam Property"', () => {
    render(<ReceiptViewer {...defaultProps} />);
    expect(screen.getByText(/Zam Property/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ReceiptViewer — different payment statuses
// ---------------------------------------------------------------------------

describe('ReceiptViewer — status variants', () => {
  it('shows "Pending" for pending payment', () => {
    const pendingPayment = createPayment({ status: PaymentStatus.PENDING });
    render(<ReceiptViewer payment={pendingPayment} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows "Processing" for processing payment', () => {
    const processingPayment = createPayment({ status: PaymentStatus.PROCESSING });
    render(<ReceiptViewer payment={processingPayment} />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('shows failed status for failed payment', () => {
    const failedPayment = createPayment({ status: PaymentStatus.FAILED });
    render(<ReceiptViewer payment={failedPayment} />);
    // Failed status shows the raw enum or "Failed"
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ReceiptViewer — different payment methods
// ---------------------------------------------------------------------------

describe('ReceiptViewer — payment methods', () => {
  it('shows FPX Online Banking for FPX method', () => {
    const fpxPayment = createPayment({ method: PaymentMethod.FPX });
    render(<ReceiptViewer payment={fpxPayment} />);
    expect(screen.getByText('FPX Online Banking')).toBeInTheDocument();
  });

  it('shows Bank Transfer label for BANK_TRANSFER method', () => {
    const bankPayment = createPayment({ method: PaymentMethod.BANK_TRANSFER });
    render(<ReceiptViewer payment={bankPayment} />);
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ReceiptViewer — optional fields
// ---------------------------------------------------------------------------

describe('ReceiptViewer — optional fields', () => {
  it('renders without billNumber', () => {
    const payment = createPayment();
    render(<ReceiptViewer payment={payment} />);
    expect(screen.getAllByText('Payment Receipt').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without propertyName or payerName', () => {
    const payment = createPayment();
    render(<ReceiptViewer payment={payment} />);
    expect(screen.getAllByText('Payment Receipt').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Sunny Condo')).not.toBeInTheDocument();
  });

  it('handles payment without receiptNumber', () => {
    const noReceiptPayment = createPayment({ receiptNumber: null });
    render(<ReceiptViewer payment={noReceiptPayment} />);
    // Should still render without error
    expect(screen.getAllByText('Payment Receipt').length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// ReceiptViewerSkeleton
// ---------------------------------------------------------------------------

describe('ReceiptViewerSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<ReceiptViewerSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders amount skeleton area', () => {
    render(<ReceiptViewerSkeleton />);
    // The skeleton has a rounded-lg bg-muted/50 container
    const { container } = render(<ReceiptViewerSkeleton />);
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
  });
});
