// =============================================================================
// Step 3: Documents — Placeholder for file uploads
// =============================================================================
// Document upload will be implemented in Session 2.9 (Media Upload Component).
// For now, show a placeholder UI similar to listing-form's step-media.
// =============================================================================

"use client";

import { FileUp, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepDocuments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload business registration documents and licences for verification.
          You can add documents later after completing onboarding.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <FileUp className="size-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold">Document Upload</h3>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Document upload with S3 presigned URL flow will be available in a
            future update. You can complete onboarding now and upload supporting
            documents later.
          </p>

          <div className="mt-6 max-w-md space-y-2 rounded-lg border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                The document upload component (Session 2.9) will support:
              </span>
            </div>
            <ul className="ml-5 list-disc space-y-0.5">
              <li>SSM company registration certificate</li>
              <li>Real estate agent licence (REN/REA)</li>
              <li>Business insurance documents</li>
              <li>Any other supporting documents</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        <strong>Optional for now</strong> — You can skip this step and submit
        your onboarding application without documents. Our team may request them
        during the review process.
      </div>
    </div>
  );
}
