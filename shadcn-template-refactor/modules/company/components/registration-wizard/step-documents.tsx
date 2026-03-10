// =============================================================================
// Step 3: Documents — SSM document and business license upload
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  FileText,
  Upload,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import type { RegistrationFormValues } from "./registration-schema";

// ---------------------------------------------------------------------------
// Document upload field component
// ---------------------------------------------------------------------------

interface DocumentUploadFieldProps {
  label: string;
  description: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}

function DocumentUploadField({
  label,
  description,
  required = false,
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png",
}: DocumentUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setFileName(file.name);

      try {
        // Simulate upload — in production this would use presigned URL
        // For now, we store a placeholder URL that will be replaced on submit
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const placeholderUrl = `uploaded://${file.name}`;
        onChange(placeholderUrl);
      } catch {
        onChange("");
        setFileName("");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange("");
    setFileName("");
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {label} {required && "*"}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle className="size-5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {fileName || "Document uploaded"}
            </p>
            <p className="text-xs text-muted-foreground">
              Upload complete
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleRemove}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
            isUploading
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Uploading {fileName}...
              </span>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                Click to upload
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, JPG, or PNG (max 10MB)
              </span>
            </>
          )}
          <Input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step component
// ---------------------------------------------------------------------------

export function StepDocuments() {
  const { control } = useFormContext<RegistrationFormValues>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Business Documents
          </CardTitle>
          <CardDescription>
            Upload your company documents for verification. These will be
            reviewed by our team before your company is activated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB per
              document.
            </AlertDescription>
          </Alert>

          <FormField
            control={control}
            name="ssmDocumentUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DocumentUploadField
                    label="SSM Registration Certificate"
                    description="Company registration certificate from Suruhanjaya Syarikat Malaysia (SSM)"
                    required
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t" />

          <FormField
            control={control}
            name="businessLicenseUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DocumentUploadField
                    label="Business License"
                    description="Business license or other supporting documents (if applicable)"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Optional — required for certain company types
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
