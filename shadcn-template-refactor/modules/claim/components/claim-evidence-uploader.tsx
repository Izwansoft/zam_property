// =============================================================================
// ClaimEvidenceUploader — Upload photos, receipts, quotes for claims
// =============================================================================
// Uses presigned URL flow via useUploadEvidence.
// Supports: PHOTO (10MB), VIDEO (100MB), RECEIPT (10MB), QUOTE (10MB)
// =============================================================================

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Receipt,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUploadEvidence } from "../hooks";
import {
  EvidenceType,
  EVIDENCE_TYPE_CONFIG,
  type ClaimEvidence,
} from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadItem {
  id: string;
  file: File;
  type: EvidenceType;
  description: string;
  status: "pending" | "uploading" | "confirming" | "complete" | "error";
  progress: number;
  error?: string;
  evidence?: ClaimEvidence;
}

interface ClaimEvidenceUploaderProps {
  claimId: string;
  /** Existing evidence (read-only display) */
  existingEvidence?: ClaimEvidence[];
  /** Callback when upload completes */
  onUploadComplete?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEvidenceIcon(type: string) {
  switch (type) {
    case EvidenceType.PHOTO:
      return Camera;
    case EvidenceType.VIDEO:
      return Camera;
    case EvidenceType.RECEIPT:
      return Receipt;
    case EvidenceType.QUOTE:
      return FileText;
    default:
      return ImagePlus;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let uploadCounter = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimEvidenceUploader({
  claimId,
  existingEvidence = [],
  onUploadComplete,
  className = "",
}: ClaimEvidenceUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [selectedType, setSelectedType] = useState<EvidenceType>(
    EvidenceType.PHOTO
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const evidenceMutation = useUploadEvidence(claimId);

  // Get current type config
  const typeConfig = EVIDENCE_TYPE_CONFIG[selectedType];

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files?.length) return;

      const newItems: UploadItem[] = [];

      for (const file of Array.from(files)) {
        // Validate size
        if (file.size > typeConfig.maxSize) {
          newItems.push({
            id: `upload-${++uploadCounter}`,
            file,
            type: selectedType,
            description: "",
            status: "error",
            progress: 0,
            error: `File too large. Max ${formatFileSize(typeConfig.maxSize)}.`,
          });
          continue;
        }

        newItems.push({
          id: `upload-${++uploadCounter}`,
          file,
          type: selectedType,
          description: "",
          status: "pending",
          progress: 0,
        });
      }

      setItems((prev) => [...prev, ...newItems]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [selectedType, typeConfig.maxSize]
  );

  // Upload a single item
  const uploadItem = useCallback(
    async (item: UploadItem) => {
      // Update status
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading" as const, progress: 0 } : i
        )
      );

      try {
        // Step 1: Get presigned URL
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "confirming" as const } : i
          )
        );

        const result = await evidenceMutation.mutateAsync({
          type: item.type,
          fileName: item.file.name,
          mimeType: item.file.type,
          fileSize: item.file.size,
          description: item.description || undefined,
        });

        // Step 2: Upload to presigned URL
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "uploading" as const } : i
          )
        );

        await axios.put(result.uploadUrl, item.file, {
          headers: { "Content-Type": item.file.type },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
              : 0;
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress: percent } : i
              )
            );
          },
        });

        // Step 3: Complete
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "complete" as const,
                  progress: 100,
                  evidence: result.evidence,
                }
              : i
          )
        );

        onUploadComplete?.();
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error" as const,
                  error: "Upload failed. Please try again.",
                }
              : i
          )
        );
      }
    },
    [evidenceMutation, onUploadComplete]
  );

  // Upload all pending items
  const uploadAllPending = useCallback(() => {
    const pending = items.filter((i) => i.status === "pending");
    for (const item of pending) {
      uploadItem(item);
    }
  }, [items, uploadItem]);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const uploadingCount = items.filter(
    (i) => i.status === "uploading" || i.status === "confirming"
  ).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Evidence Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type selector + File input */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Evidence Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as EvidenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVIDENCE_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept={typeConfig.accept}
              multiple
              onChange={handleFileSelect}
              className="max-w-64"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Max file size: {formatFileSize(typeConfig.maxSize)} per file
        </p>

        {/* Existing evidence */}
        {existingEvidence.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Existing Evidence ({existingEvidence.length})
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {existingEvidence.map((ev) => {
                const Icon = getEvidenceIcon(ev.type);
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{ev.fileName}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending / uploading items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Uploads ({items.length})
            </Label>
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = getEvidenceIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm">
                          {item.file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>
                      {(item.status === "uploading" ||
                        item.status === "confirming") && (
                        <Progress value={item.progress} className="h-1.5" />
                      )}
                      {item.status === "error" && (
                        <p className="text-xs text-destructive">{item.error}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {item.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(item.status === "uploading" ||
                        item.status === "confirming") && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {item.status === "complete" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {item.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload button */}
        {pendingCount > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={uploadAllPending}
              disabled={uploadingCount > 0}
              size="sm"
            >
              {uploadingCount > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && existingEvidence.length === 0 && (
          <Alert>
            <ImagePlus className="h-4 w-4" />
            <AlertDescription>
              Upload photos of damage, receipts for repairs, or quotes from
              contractors to support your claim.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
