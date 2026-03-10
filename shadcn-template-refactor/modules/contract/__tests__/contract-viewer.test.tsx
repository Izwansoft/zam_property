/**
 * Unit Tests — ContractViewer
 *
 * Tests contract detail rendering: header, status badge, tabs (Document,
 * Signers, Terms), signing actions, download button, and signer cards.
 *
 * @see modules/contract/components/contract-viewer.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContractViewer, ContractViewerSkeleton } from '../components/contract-viewer';
import {
  ContractStatus,
  ContractType,
  SignerStatus,
  SignerRole,
} from '../types';
import {
  createContractDetail,
  createContractSigner,
  createContractEvent,
  createContractTerms,
  resetIdCounter,
} from '@/test/factories';

// ---------------------------------------------------------------------------
// Reset ID counter between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// ContractViewer — header rendering
// ---------------------------------------------------------------------------

describe('ContractViewer — header', () => {
  it('renders the contract title', () => {
    const contract = createContractDetail({
      title: 'Tenancy Agreement — Sunny Condo A-12-3',
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByText('Tenancy Agreement — Sunny Condo A-12-3')).toBeInTheDocument();
  });

  it('renders property title from tenancy', () => {
    const contract = createContractDetail({
      tenancy: {
        id: 'tenancy-001',
        propertyTitle: 'Sunny Condo Unit A-12-3',
        propertyAddress: '123 Jalan Ampang',
        tenantName: 'Sarah Tan',
        ownerName: 'Ahmad Abdullah',
      },
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByText('Sunny Condo Unit A-12-3')).toBeInTheDocument();
  });

  it('renders version badge', () => {
    const contract = createContractDetail({ version: 2 });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('displays signed count out of total signers', () => {
    const contract = createContractDetail({
      signers: [
        createContractSigner({ status: SignerStatus.SIGNED }),
        createContractSigner({ status: SignerStatus.PENDING }),
      ],
    });
    render(<ContractViewer contract={contract} />);
    // "1/2 signed" appears in both the action bar and the tab badge
    const signedTexts = screen.getAllByText('1/2');
    expect(signedTexts.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// ContractViewer — action buttons
// ---------------------------------------------------------------------------

describe('ContractViewer — actions', () => {
  it('renders Download PDF button', () => {
    const contract = createContractDetail({
      pdfUrl: '/documents/contract.pdf',
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  it('calls onDownload when Download button is clicked', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    const contract = createContractDetail({
      pdfUrl: '/documents/contract.pdf',
    });
    render(<ContractViewer contract={contract} onDownload={onDownload} />);

    await user.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('disables download when no pdfUrl', () => {
    const contract = createContractDetail({
      pdfUrl: undefined,
      documentUrl: undefined,
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeDisabled();
  });

  it('shows "Sign Contract" when user has pending signature', () => {
    const contract = createContractDetail({
      status: ContractStatus.PENDING_SIGNATURES,
      signers: [
        createContractSigner({
          userId: 'current-user',
          status: SignerStatus.PENDING,
          role: SignerRole.TENANT,
        }),
      ],
    });
    render(<ContractViewer contract={contract} currentUserId="current-user" />);
    expect(screen.getByRole('button', { name: /Sign Contract/i })).toBeInTheDocument();
  });

  it('does NOT show "Sign Contract" if user already signed', () => {
    const contract = createContractDetail({
      status: ContractStatus.PENDING_SIGNATURES,
      signers: [
        createContractSigner({
          userId: 'current-user',
          status: SignerStatus.SIGNED,
          role: SignerRole.TENANT,
        }),
      ],
    });
    render(<ContractViewer contract={contract} currentUserId="current-user" />);
    expect(screen.queryByRole('button', { name: /Sign Contract/i })).not.toBeInTheDocument();
  });

  it('does NOT show "Sign Contract" for fully signed contracts', () => {
    const contract = createContractDetail({
      status: ContractStatus.SIGNED,
      signers: [
        createContractSigner({ status: SignerStatus.SIGNED }),
        createContractSigner({ status: SignerStatus.SIGNED }),
      ],
    });
    render(<ContractViewer contract={contract} currentUserId="user-001" />);
    expect(screen.queryByRole('button', { name: /Sign Contract/i })).not.toBeInTheDocument();
  });

  it('calls onSign when Sign Contract is clicked', async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    const contract = createContractDetail({
      status: ContractStatus.PENDING_SIGNATURES,
      signers: [
        createContractSigner({
          userId: 'current-user',
          status: SignerStatus.PENDING,
        }),
      ],
    });
    render(
      <ContractViewer
        contract={contract}
        currentUserId="current-user"
        onSign={onSign}
      />
    );

    await user.click(screen.getByRole('button', { name: /Sign Contract/i }));
    expect(onSign).toHaveBeenCalledTimes(1);
  });

  it('shows "Downloading..." text when isDownloading=true', () => {
    const contract = createContractDetail({
      pdfUrl: '/documents/contract.pdf',
    });
    render(<ContractViewer contract={contract} isDownloading />);
    expect(screen.getByText(/Downloading/i)).toBeInTheDocument();
  });

  it('shows external signing link when externalSigningUrl is set', () => {
    const contract = createContractDetail({
      externalSigningUrl: 'https://docusign.example.com/sign/123',
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByRole('link', { name: /Sign Externally/i })).toHaveAttribute(
      'href',
      'https://docusign.example.com/sign/123'
    );
  });
});

// ---------------------------------------------------------------------------
// ContractViewer — tabs
// ---------------------------------------------------------------------------

describe('ContractViewer — tabs', () => {
  it('renders 3 tabs (Document, Signers, Terms)', () => {
    const contract = createContractDetail();
    render(<ContractViewer contract={contract} />);

    expect(screen.getByRole('tab', { name: /Document/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Signers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Terms/i })).toBeInTheDocument();
  });

  it('defaults to Document tab', () => {
    const contract = createContractDetail();
    render(<ContractViewer contract={contract} />);

    const docTab = screen.getByRole('tab', { name: /Document/i });
    expect(docTab).toHaveAttribute('data-state', 'active');
  });

  it('switches to Signers tab on click', async () => {
    const user = userEvent.setup();
    const contract = createContractDetail();
    render(<ContractViewer contract={contract} />);

    await user.click(screen.getByRole('tab', { name: /Signers/i }));

    const signersTab = screen.getByRole('tab', { name: /Signers/i });
    expect(signersTab).toHaveAttribute('data-state', 'active');
  });

  it('Document tab shows "Document Not Available" when no pdf or html', async () => {
    const contract = createContractDetail({
      pdfUrl: undefined,
      documentUrl: undefined,
      htmlContent: undefined,
    });
    render(<ContractViewer contract={contract} />);
    expect(screen.getByText('Document Not Available')).toBeInTheDocument();
  });

  it('Document tab embeds PDF iframe when pdfUrl is present', () => {
    const contract = createContractDetail({ pdfUrl: '/docs/contract.pdf' });
    render(<ContractViewer contract={contract} />);
    const iframe = screen.getByTitle('Contract PDF');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/docs/contract.pdf#view=FitH');
  });

  it('Terms tab shows financial terms', async () => {
    const user = userEvent.setup();
    const contract = createContractDetail({
      terms: createContractTerms({
        financials: {
          monthlyRent: 2500,
          securityDeposit: 5000,
          utilityDeposit: 500,
          stampDuty: 240,
          currency: 'MYR',
        },
        noticePeriodDays: 30,
      }),
    });
    render(<ContractViewer contract={contract} />);

    await user.click(screen.getByRole('tab', { name: /Terms/i }));

    // Terms content should now be visible
    expect(screen.getByText(/Monthly Rent/i)).toBeInTheDocument();
    expect(screen.getByText(/Notice Period/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ContractViewerSkeleton
// ---------------------------------------------------------------------------

describe('ContractViewerSkeleton', () => {
  it('renders skeleton loading elements', () => {
    const { container } = render(<ContractViewerSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
