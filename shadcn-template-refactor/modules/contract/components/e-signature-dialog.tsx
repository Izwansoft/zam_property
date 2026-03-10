// =============================================================================
// ESignatureDialog — Enhanced e-signature dialog with signature pad
// =============================================================================
// Full-featured dialog for signing contracts with typed or drawn signatures.
// Includes terms acceptance and external provider integration.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Shield,
  FileSignature,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { SignaturePad, type SignatureData } from "./signature-pad";
import type { ContractDetail, ContractSigner } from "../types";
import { SignerRole } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ESignatureDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** The contract being signed */
  contract: ContractDetail;
  /** Current user's signer record */
  currentSigner?: ContractSigner;
  /** Callback when signature is submitted */
  onSign: (data: SignContractPayload) => Promise<void>;
  /** Whether signing is in progress */
  isSigningPending?: boolean;
  /** External signing URL (DocuSign, SignNow, etc.) */
  externalSigningUrl?: string;
}

export interface SignContractPayload {
  /** Signature image data (base64) */
  signature?: string;
  /** Typed name as signature */
  typedName?: string;
  /** User accepted terms */
  acceptTerms: boolean;
  /** Signature method used */
  signatureMethod: "draw" | "type";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<SignerRole, string> = {
  [SignerRole.OWNER]: "Property Owner/Landlord",
  [SignerRole.TENANT]: "Partner/Tenant",
  [SignerRole.WITNESS]: "Witness",
  [SignerRole.GUARANTOR]: "Guarantor",
};

// ---------------------------------------------------------------------------
// ESignatureDialog Component
// ---------------------------------------------------------------------------

export function ESignatureDialog({
  open,
  onOpenChange,
  contract,
  currentSigner,
  onSign,
  isSigningPending,
  externalSigningUrl,
}: ESignatureDialogProps) {
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate and submit signature
  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!signatureData) {
      setError("Please provide your signature");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    try {
      await onSign({
        signature: signatureData.imageData,
        typedName: signatureData.typedName,
        acceptTerms: true,
        signatureMethod: signatureData.method,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract");
    }
  }, [signatureData, acceptTerms, onSign]);

  // Handle signature change
  const handleSignatureChange = useCallback((data: SignatureData | null) => {
    setSignatureData(data);
    setError(null);
  }, []);

  // Handle terms checkbox
  const handleAcceptTermsChange = useCallback((checked: boolean) => {
    setAcceptTerms(checked);
    setError(null);
  }, []);

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSignatureData(null);
        setAcceptTerms(false);
        setError(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const canSubmit = !!signatureData && acceptTerms && !isSigningPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Sign Contract
          </DialogTitle>
          <DialogDescription>
            By signing, you agree to all terms and conditions in this tenancy
            agreement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contract Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium">{contract.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {contract.tenancy?.propertyAddress}
            </p>
            {currentSigner && (
              <p className="text-sm text-muted-foreground mt-2">
                Signing as:{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[currentSigner.role]}
                </span>
              </p>
            )}
          </div>

          {/* External Signing Option */}
          {externalSigningUrl && (
            <>
              <div className="text-center">
                <Button asChild>
                  <a
                    href={externalSigningUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Sign with DocuSign
                  </a>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  You will be redirected to DocuSign to complete your signature
                </p>
              </div>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR sign below
                </span>
              </div>
            </>
          )}

          {/* Signature Pad */}
          <SignaturePad
            onChange={handleSignatureChange}
            initialName={currentSigner?.name || ""}
            disabled={isSigningPending}
            width={384}
            height={120}
          />

          {/* Terms Acceptance */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="accept-terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => handleAcceptTermsChange(checked === true)}
              disabled={isSigningPending}
            />
            <div className="space-y-1">
              <Label
                htmlFor="accept-terms"
                className="text-sm font-normal leading-relaxed"
              >
                I have read, understood, and agree to all terms and conditions
                in this tenancy agreement. I understand that this electronic
                signature is legally binding.
              </Label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Your signature is encrypted and securely stored. This electronic
              signature is legally binding under the Electronic Commerce Act
              2006 (Malaysia).
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSigningPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSigningPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Sign Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ESignatureDialog;
