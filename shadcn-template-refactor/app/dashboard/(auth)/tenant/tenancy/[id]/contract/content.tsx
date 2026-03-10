// =============================================================================
// Tenant Contract Page — Client content component
// =============================================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";

import { useContractByTenancy, useContractPdf } from "@/modules/contract/hooks/useContract";
import { useSignContract } from "@/modules/contract/hooks/useContractMutations";
import {
  ContractViewer,
  ContractViewerSkeleton,
} from "@/modules/contract/components/contract-viewer";
import { SignatureFlow } from "@/modules/contract/components/signature-flow";
import { ESignatureDialog, type SignContractPayload } from "@/modules/contract/components/e-signature-dialog";
import { ContractCelebration } from "@/modules/contract/components/contract-celebration";
import { ContractStatus, SignerStatus } from "@/modules/contract/types";
import { useAuth } from "@/modules/auth";
import { usePartnerId } from "@/modules/partner";
import { useTenancyBreadcrumbOverrides } from "@/modules/tenancy/components/tenancy-breadcrumb";
import { useContractRealtime } from "@/lib/websocket";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { Button } from "@/components/ui/button";

export function TenantContractContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const partnerId = usePartnerId();

  const tenancyId = params.id;

  // Breadcrumb: resolve tenancy ID to property name
  const tenancyBreadcrumbOverrides = useTenancyBreadcrumbOverrides(tenancyId);

  // Fetch contract for this tenancy
  const { data: contract, isLoading, error } = useContractByTenancy(tenancyId);
  const { data: pdfData, isLoading: isPdfLoading } = useContractPdf(
    contract?.id ?? ""
  );

  // Local state
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sign contract mutation
  const signContract = useSignContract(contract?.id ?? "");

  // Real-time contract updates
  const { isJustExecuted, resetExecuted } = useContractRealtime({
    partnerId,
    contractId: contract?.id,
    tenancyId,
    onExecuted: () => {
      setShowCelebration(true);
    },
  });

  // Check if contract was just executed (via WebSocket or after signing)
  const wasJustExecuted = isJustExecuted || showCelebration;

  // Find current user's signer record
  const currentSigner = useMemo(() => {
    if (!contract?.signers || !user?.id) return undefined;
    return contract.signers.find((s) => s.userId === user.id);
  }, [contract?.signers, user?.id]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!pdfData?.url) return;

    setIsDownloading(true);
    try {
      window.open(pdfData.url, "_blank");
    } catch (err) {
      showError("Failed to download contract");
    } finally {
      setIsDownloading(false);
    }
  }, [pdfData?.url]);

  // Handle sign via enhanced dialog
  const handleSign = useCallback(
    async (data: SignContractPayload) => {
      if (!contract?.id) return;

      try {
        const result = await signContract.mutateAsync({
          signature: data.signature,
          typedName: data.typedName,
          acceptTerms: data.acceptTerms,
        });

        setShowSignDialog(false);
        showSuccess("Contract signed successfully!");

        // Check if all parties have signed after this signature
        const allSigned = result.signers?.every(
          (s) => s.status === SignerStatus.SIGNED
        );

        if (allSigned || result.status === ContractStatus.SIGNED) {
          // Small delay to let the UI settle, then show celebration
          setTimeout(() => {
            setShowCelebration(true);
          }, 500);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign contract";
        throw new Error(message);
      }
    },
    [contract?.id, signContract]
  );

  // Handle celebration close
  const handleCelebrationClose = useCallback(
    (open: boolean) => {
      setShowCelebration(open);
      if (!open) {
        resetExecuted();
      }
    },
    [resetExecuted]
  );

  if (isLoading) {
    return <ContractViewerSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load contract
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Contract not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No contract exists for this tenancy yet. The owner may still be
          preparing the agreement.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/dashboard/tenant/tenancy/${tenancyId}`)}
        >
          Back to Tenancy
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Signature Flow Summary */}
      <div className="mb-6">
        <SignatureFlow
          contract={contract}
          currentUserId={user?.id}
          onSign={() => setShowSignDialog(true)}
          isSigningPending={signContract.isPending}
        />
      </div>

      {/* Full Contract Viewer */}
      <ContractViewer
        contract={contract}
        basePath={`/dashboard/tenant/tenancy/${tenancyId}`}
        currentUserId={user?.id}
        onSign={() => setShowSignDialog(true)}
        onDownload={handleDownload}
        isDownloading={isDownloading || isPdfLoading}
      />

      {/* Enhanced E-Signature Dialog */}
      <ESignatureDialog
        open={showSignDialog}
        onOpenChange={setShowSignDialog}
        contract={contract}
        currentSigner={currentSigner}
        onSign={handleSign}
        isSigningPending={signContract.isPending}
        externalSigningUrl={contract.externalSigningUrl}
      />

      {/* Contract Execution Celebration */}
      <ContractCelebration
        open={wasJustExecuted}
        onOpenChange={handleCelebrationClose}
        contractTitle={contract.title}
        propertyAddress={contract.tenancy?.propertyAddress}
        downloadUrl={pdfData?.url}
        tenancyId={tenancyId}
      />
    </>
  );
}