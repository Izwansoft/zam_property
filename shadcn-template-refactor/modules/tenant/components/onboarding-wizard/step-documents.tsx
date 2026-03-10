// =============================================================================
// Step 2: Documents — Upload IC front/back, payslip, etc.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { FileText, X, CheckCircle2, AlertCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { TenantDocumentType } from "../../types";
import { useTenantOnboardingStore, type UploadedDocument } from "../../store/onboarding-store";
import { DocumentUploader } from "../document-uploader";

// ---------------------------------------------------------------------------
// Document type options with descriptions
// ---------------------------------------------------------------------------

const DOCUMENT_TYPES = [
  {
    value: TenantDocumentType.IC_FRONT,
    label: "IC Front",
    description: "Front side of your Malaysian IC",
    required: true,
  },
  {
    value: TenantDocumentType.IC_BACK,
    label: "IC Back",
    description: "Back side of your Malaysian IC",
    required: false,
  },
  {
    value: TenantDocumentType.PASSPORT,
    label: "Passport",
    description: "Passport bio page (for non-Malaysians)",
    required: false,
  },
  {
    value: TenantDocumentType.EMPLOYMENT_LETTER,
    label: "Employment Letter",
    description: "Letter from your employer",
    required: false,
  },
  {
    value: TenantDocumentType.PAYSLIP,
    label: "Payslip",
    description: "Recent payslip (last 3 months)",
    required: false,
  },
  {
    value: TenantDocumentType.BANK_STATEMENT,
    label: "Bank Statement",
    description: "Recent bank statement",
    required: false,
  },
  {
    value: TenantDocumentType.UTILITY_BILL,
    label: "Utility Bill",
    description: "Recent utility bill for address verification",
    required: false,
  },
  {
    value: TenantDocumentType.REFERENCE_LETTER,
    label: "Reference Letter",
    description: "Reference from previous landlord",
    required: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepDocuments() {
  const { data, addDocument, removeDocument } = useTenantOnboardingStore();
  const [selectedType, setSelectedType] = useState<TenantDocumentType | "">("");

  const hasIdDocument = data.documents.some(
    (d) =>
      d.type === TenantDocumentType.IC_FRONT ||
      d.type === TenantDocumentType.PASSPORT
  );

  const handleUploadComplete = useCallback(
    (doc: UploadedDocument) => {
      addDocument(doc);
      setSelectedType("");
    },
    [addDocument]
  );

  const getDocumentTypeInfo = (type: TenantDocumentType) => {
    return DOCUMENT_TYPES.find((dt) => dt.value === type);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload your identification and supporting documents for verification.
            At minimum, you need to upload your IC Front or Passport.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document type selector */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select
                value={selectedType}
                onValueChange={(v) =>
                  setSelectedType(v as TenantDocumentType)
                }
              >
                <SelectTrigger className="sm:w-[250px]">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => {
                    const alreadyUploaded = data.documents.some(
                      (d) => d.type === dt.value
                    );
                    return (
                      <SelectItem
                        key={dt.value}
                        value={dt.value}
                        disabled={alreadyUploaded}
                      >
                        <div className="flex items-center gap-2">
                          <span>{dt.label}</span>
                          {dt.required && (
                            <span className="text-xs text-destructive">*</span>
                          )}
                          {alreadyUploaded && (
                            <CheckCircle2 className="size-3 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedType && (
                <p className="text-sm text-muted-foreground self-center">
                  {getDocumentTypeInfo(selectedType)?.description}
                </p>
              )}
            </div>

            {/* Uploader appears when type is selected */}
            {selectedType && (
              <DocumentUploader
                documentType={selectedType}
                onUploadComplete={handleUploadComplete}
                onCancel={() => setSelectedType("")}
              />
            )}
          </div>

          {/* Validation message */}
          {!hasIdDocument && data.documents.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
              <AlertCircle className="size-4" />
              <span>Please upload IC Front or Passport for identity verification</span>
            </div>
          )}

          {/* Uploaded documents list */}
          {data.documents.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Uploaded Documents</h4>
              <div className="space-y-2">
                {data.documents.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    onRemove={() => removeDocument(doc.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="size-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a document type above to start uploading
              </p>
            </div>
          )}

          {/* Requirements checklist */}
          <div className="rounded-md bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Document Requirements</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    hasIdDocument ? "bg-green-500" : "bg-destructive"
                  )}
                />
                IC Front or Passport (Required)
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Employment Letter or Payslip (Recommended)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Item
// ---------------------------------------------------------------------------

interface DocumentItemProps {
  document: UploadedDocument;
  onRemove: () => void;
}

function DocumentItem({ document, onRemove }: DocumentItemProps) {
  const typeInfo = DOCUMENT_TYPES.find((dt) => dt.value === document.type);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{typeInfo?.label || document.type}</p>
          <p className="text-xs text-muted-foreground">
            {document.fileName} • {formatFileSize(document.fileSize)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-green-500" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRemove}
        >
          <X className="size-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
}
