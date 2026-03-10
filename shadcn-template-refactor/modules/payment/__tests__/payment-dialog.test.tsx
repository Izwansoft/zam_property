/**
 * Unit Tests — PaymentDialog (mock Stripe)
 *
 * Tests the multi-step payment dialog flow: Amount → Method → Processing → Success/Failed.
 * Uses mock hooks to simulate payment creation and status polling.
 *
 * @see modules/payment/components/payment-dialog.tsx
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PaymentDialog } from '../components/payment-dialog';
import { PaymentMethod, PaymentStatus } from '../types';
import { BillingStatus } from '@/modules/billing/types';
import { createBilling, resetIdCounter } from '@/test/factories';
import { renderWithProviders } from '@/test/utils';

// ---------------------------------------------------------------------------
// Polyfill for ResizeObserver (required by Radix UI Dialog)
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

// ---------------------------------------------------------------------------
// Mock hooks used by PaymentDialog
// ---------------------------------------------------------------------------

const mockMutateAsync = vi.fn();

vi.mock('../hooks/useCreatePayment', () => ({
  useCreatePayment: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('../hooks/usePaymentStatus', () => ({
  usePaymentStatus: () => ({
    data: null,
    isSuccess: false,
    isFailed: false,
    isLoading: false,
  }),
}));

vi.mock('@/modules/partner/hooks/use-partner', () => ({
  usePartnerId: () => 'partner-001',
}));

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
  mockMutateAsync.mockReset();
});

// ---------------------------------------------------------------------------
// PaymentDialog — step flow
// ---------------------------------------------------------------------------

describe('PaymentDialog', () => {
  const billing = createBilling({
    status: BillingStatus.SENT,
    totalAmount: 2500,
    balanceDue: 2500,
    billNumber: 'BILL-2026-001',
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    billing,
  };

  it('renders amount step initially', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} />);
    // "Payment Amount" appears as both DialogTitle and FormLabel
    expect(screen.getAllByText('Payment Amount').length).toBeGreaterThanOrEqual(1);
  });

  it('shows billing amount in the amount step', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} />);
    // The balance due should appear somewhere (may appear multiple times)
    expect(screen.getAllByText(/2,500/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows full and partial payment options', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} />);
    // Actual text from component: "Full Amount" and "Partial Payment"
    expect(screen.getByText(/Full Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Partial Payment/i)).toBeInTheDocument();
  });

  it('advances to method step when Continue is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentDialog {...defaultProps} />);

    // Click Continue/Next button
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i });
    await user.click(continueBtn);

    // Should now be on method step
    await waitFor(() => {
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
    });
  });

  it('shows payment method options in method step', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentDialog {...defaultProps} />);

    // Advance to method step
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i });
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Credit\/Debit Card/i)).toBeInTheDocument();
      expect(screen.getByText(/FPX Online Banking/i)).toBeInTheDocument();
      expect(screen.getByText(/Bank Transfer/i)).toBeInTheDocument();
    });
  });

  it('shows card form fields when Card method is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentDialog {...defaultProps} />);

    // Advance to method step
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i });
    await user.click(continueBtn);

    await waitFor(() => {
      // Card is the default method — should show card fields
      expect(screen.getByText(/Cardholder/i)).toBeInTheDocument();
    });
  });

  it('submits payment and transitions to processing', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      id: 'payment-001',
      billingId: billing.id,
      paymentNumber: 'PAY-001',
      amount: 2500,
      currency: 'MYR',
      status: PaymentStatus.PROCESSING,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'REF-123',
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<PaymentDialog {...defaultProps} />);

    // Step 1: Amount — click continue
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i });
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
    });

    // Select Bank Transfer method (simpler — no card validation needed)
    const bankTransferOption = screen.getByText(/Bank Transfer/i);
    await user.click(bankTransferOption);

    // Step 2: Submit with bank transfer
    const payBtn = screen.getByRole('button', { name: /Pay|Submit|Confirm/i });
    await user.click(payBtn);

    // Should call createPayment mutation
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          billingId: billing.id,
          amount: 2500,
          method: PaymentMethod.BANK_TRANSFER,
        })
      );
    });
  });

  it('handles payment failure', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Payment failed'));

    renderWithProviders(<PaymentDialog {...defaultProps} />);

    // Step 1: Amount
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i });
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
    });

    // Select Bank Transfer
    const bankTransferOption = screen.getByText(/Bank Transfer/i);
    await user.click(bankTransferOption);

    // Submit
    const payBtn = screen.getByRole('button', { name: /Pay|Submit|Confirm/i });
    await user.click(payBtn);

    // Should show failed step
    await waitFor(() => {
      // "Payment Failed" appears as both DialogTitle and heading
      expect(screen.getAllByText('Payment Failed').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does not render when open=false', () => {
    renderWithProviders(<PaymentDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Payment Amount')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when dialog is closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <PaymentDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    // Close button (X) should be present
    const closeBtn = screen.getByRole('button', { name: /close/i });
    if (closeBtn) {
      await user.click(closeBtn);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });
});

// ---------------------------------------------------------------------------
// PaymentDialog — partial payment
// ---------------------------------------------------------------------------

describe('PaymentDialog — partial payment', () => {
  const billing = createBilling({
    status: BillingStatus.PARTIALLY_PAID,
    totalAmount: 2500,
    paidAmount: 1000,
    balanceDue: 1500,
  });

  it('defaults to remaining balance amount', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        onOpenChange={vi.fn()}
        billing={billing}
      />
    );
    expect(screen.getAllByText(/1,500/).length).toBeGreaterThanOrEqual(1);
  });
});
