// =============================================================================
// MaintenanceRequestForm — Form for creating maintenance tickets
// =============================================================================
// Uses React Hook Form + Zod validation.
// Includes category dropdown, priority selection, and photo upload.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Droplets,
  Zap,
  Wrench,
  Building2,
  HelpCircle,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormWrapper, FormSection, FormGrid } from "@/components/forms/form-wrapper";
import {
  TextField,
  TextAreaField,
  SelectField,
} from "@/components/forms/form-fields";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import {
  MaintenanceCategory,
  MaintenancePriority,
  MAINTENANCE_CATEGORY_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from "../types";
import { useCreateMaintenance, useAddMaintenanceAttachment } from "../hooks";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const maintenanceRequestSchema = z.object({
  tenancyId: z.string().uuid("Please select a tenancy"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category: z.nativeEnum(MaintenanceCategory, {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  location: z.string().max(200).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
});

type MaintenanceRequestFormValues = z.infer<typeof maintenanceRequestSchema>;

// ---------------------------------------------------------------------------
// Category options with icons
// ---------------------------------------------------------------------------

const categoryOptions = Object.entries(MAINTENANCE_CATEGORY_CONFIG).map(
  ([value, config]) => ({
    value,
    label: config.label,
  })
);

const priorityOptions = Object.entries(MAINTENANCE_PRIORITY_CONFIG).map(
  ([value, config]) => ({
    value,
    label: config.label,
  })
);

// ---------------------------------------------------------------------------
// Photo preview type
// ---------------------------------------------------------------------------

interface PhotoPreview {
  id: string;
  file: File;
  preview: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Category Icon Component
// ---------------------------------------------------------------------------

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case MaintenanceCategory.PLUMBING:
      return <Droplets className="h-4 w-4 text-blue-600" />;
    case MaintenanceCategory.ELECTRICAL:
      return <Zap className="h-4 w-4 text-yellow-600" />;
    case MaintenanceCategory.APPLIANCE:
      return <Wrench className="h-4 w-4 text-purple-600" />;
    case MaintenanceCategory.STRUCTURAL:
      return <Building2 className="h-4 w-4 text-stone-600" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-600" />;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceRequestFormProps {
  /** Pre-filled tenancy ID (from tenancy detail quick action) */
  tenancyId?: string;
  /** Available tenancies for dropdown */
  tenancies?: Array<{
    id: string;
    property?: { title: string; address?: string };
  }>;
  /** Callback after successful creation */
  onSuccess?: (ticketId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceRequestForm({
  tenancyId,
  tenancies = [],
  onSuccess,
}: MaintenanceRequestFormProps) {
  const router = useRouter();
  const createMaintenance = useCreateMaintenance();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Photo handlers
  const handlePhotoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const maxFiles = 5;
      const maxSize = 10 * 1024 * 1024; // 10MB

      const newPhotos: PhotoPreview[] = [];

      for (const file of files) {
        if (photos.length + newPhotos.length >= maxFiles) {
          showError(`Maximum ${maxFiles} photos allowed`);
          break;
        }
        if (file.size > maxSize) {
          showError(`${file.name} exceeds 10MB limit`);
          continue;
        }
        if (!file.type.startsWith("image/")) {
          showError(`${file.name} is not an image`);
          continue;
        }

        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }

      setPhotos((prev) => [...prev, ...newPhotos]);

      // Reset input
      e.target.value = "";
    },
    [photos]
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Upload photos after ticket creation
  const uploadPhotos = async (ticketId: string) => {
    if (photos.length === 0) return;

    setIsUploadingPhotos(true);

    for (const photo of photos) {
      try {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, uploading: true } : p
          )
        );

        // Get presigned URL
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/maintenance/${ticketId}/attachments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "IMAGE",
              fileName: photo.file.name,
              mimeType: photo.file.type,
              fileSize: photo.file.size,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to get upload URL");

        const { uploadUrl } = await response.json();

        // Upload to S3
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": photo.file.type },
          body: photo.file,
        });

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, uploaded: true }
              : p
          )
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, error: "Upload failed" }
              : p
          )
        );
      }
    }

    setIsUploadingPhotos(false);
  };

  // Form submit handler
  const handleSubmit = async (values: MaintenanceRequestFormValues) => {
    try {
      const result = await createMaintenance.mutateAsync({
        tenancyId: values.tenancyId,
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location || undefined,
        priority: values.priority,
      });

      // Upload photos if any
      if (photos.length > 0) {
        await uploadPhotos(result.id);
      }

      showSuccess("Maintenance request submitted successfully");

      if (onSuccess) {
        onSuccess(result.id);
      } else {
        router.push(`/dashboard/tenant/maintenance/${result.id}`);
      }
    } catch {
      showError("Failed to submit maintenance request");
    }
  };

  // Build tenancy options
  const tenancyOptions = tenancies.map((t) => ({
    value: t.id,
    label: t.property?.title || t.id,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          New Maintenance Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormWrapper<MaintenanceRequestFormValues>
          schema={maintenanceRequestSchema as any}
          defaultValues={{
            tenancyId: tenancyId || "",
            title: "",
            description: "",
            category: undefined as unknown as MaintenanceCategory,
            location: "",
            priority: MaintenancePriority.MEDIUM,
          }}
          onSubmit={handleSubmit}
          isSubmitting={createMaintenance.isPending || isUploadingPhotos}
        >
          {(form) => (
            <div className="space-y-6">
              {/* Tenancy Selection */}
              {!tenancyId && tenancyOptions.length > 0 && (
                <FormSection title="Property">
                  <SelectField
                    name="tenancyId"
                    label="Select Property"
                    options={tenancyOptions}
                    placeholder="Choose a property..."
                    required
                  />
                </FormSection>
              )}

              {/* Category & Priority */}
              <FormSection title="Issue Details">
                <FormGrid columns={2}>
                  <SelectField
                    name="category"
                    label="Category"
                    options={categoryOptions}
                    placeholder="Select category..."
                    required
                  />
                  <SelectField
                    name="priority"
                    label="Priority"
                    options={priorityOptions}
                    placeholder="Select priority..."
                    description="Urgent = safety hazard or no water/electricity"
                  />
                </FormGrid>

                <TextField
                  name="title"
                  label="Title"
                  placeholder="Brief summary of the issue (e.g., Leaking kitchen pipe)"
                  required
                />

                <TextAreaField
                  name="description"
                  label="Description"
                  placeholder="Describe the issue in detail. Include when it started, severity, and any temporary measures taken..."
                  required
                  rows={5}
                />

                <TextField
                  name="location"
                  label="Location"
                  placeholder="Room or area (e.g., Master bedroom, Kitchen)"
                  description="Specific room or area where the issue is located"
                />
              </FormSection>

              {/* Photo Upload */}
              <FormSection title="Photos">
                <p className="text-sm text-muted-foreground mb-3">
                  Upload photos of the issue to help us diagnose the problem
                  faster. Max 5 photos, 10MB each.
                </p>

                {/* Photo Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 mb-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg border overflow-hidden group"
                      >
                        <img
                          src={photo.preview}
                          alt="Issue photo"
                          className="h-full w-full object-cover"
                        />
                        {/* Upload status overlay */}
                        {photo.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                        {photo.uploaded && (
                          <div className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-1">
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        {photo.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                            <span className="text-xs text-white font-medium">
                              Failed
                            </span>
                          </div>
                        )}
                        {/* Remove button */}
                        {!photo.uploading && !photo.uploaded && (
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label={`Remove ${photo.file.name}`}
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {photos.length < 5 && (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {photos.length === 0
                        ? "Click or drag photos here"
                        : `Add more photos (${photos.length}/5)`}
                    </span>
                  </label>
                )}
              </FormSection>
            </div>
          )}
        </FormWrapper>
      </CardContent>
    </Card>
  );
}
