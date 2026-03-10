// =============================================================================
// Inspection Module — Type Definitions
// =============================================================================
// Matches backend Prisma schema exactly.
// Enums: InspectionType, InspectionStatus, InspectionCategory, InspectionCondition
// =============================================================================

import type { LucideIcon } from "lucide-react";
import {
  LogIn,
  RotateCcw,
  LogOut,
  AlertTriangle,
  Calendar,
  Video,
  Upload,
  MapPin,
  CheckCircle2,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Enums (must match backend exactly)
// ---------------------------------------------------------------------------

export enum InspectionType {
  MOVE_IN = "MOVE_IN",
  PERIODIC = "PERIODIC",
  MOVE_OUT = "MOVE_OUT",
  EMERGENCY = "EMERGENCY",
}

export enum InspectionStatus {
  SCHEDULED = "SCHEDULED",
  VIDEO_REQUESTED = "VIDEO_REQUESTED",
  VIDEO_SUBMITTED = "VIDEO_SUBMITTED",
  ONSITE_PENDING = "ONSITE_PENDING",
  COMPLETED = "COMPLETED",
  REPORT_GENERATED = "REPORT_GENERATED",
}

export enum InspectionCategory {
  BEDROOM = "BEDROOM",
  BATHROOM = "BATHROOM",
  KITCHEN = "KITCHEN",
  LIVING = "LIVING",
  EXTERIOR = "EXTERIOR",
  OTHER = "OTHER",
}

export enum InspectionCondition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  DAMAGED = "DAMAGED",
}

// ---------------------------------------------------------------------------
// Status config for UI display
// ---------------------------------------------------------------------------

export type InspectionStatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export interface InspectionStatusConfig {
  label: string;
  variant: InspectionStatusVariant;
  icon: LucideIcon;
  description: string;
}

export const INSPECTION_STATUS_CONFIG: Record<
  InspectionStatus,
  InspectionStatusConfig
> = {
  [InspectionStatus.SCHEDULED]: {
    label: "Scheduled",
    variant: "secondary",
    icon: Calendar,
    description: "Inspection is scheduled",
  },
  [InspectionStatus.VIDEO_REQUESTED]: {
    label: "Video Requested",
    variant: "outline",
    icon: Video,
    description: "Video inspection has been requested",
  },
  [InspectionStatus.VIDEO_SUBMITTED]: {
    label: "Video Submitted",
    variant: "secondary",
    icon: Upload,
    description: "Video has been submitted for review",
  },
  [InspectionStatus.ONSITE_PENDING]: {
    label: "Onsite Pending",
    variant: "outline",
    icon: MapPin,
    description: "Awaiting onsite inspection",
  },
  [InspectionStatus.COMPLETED]: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle2,
    description: "Inspection has been completed",
  },
  [InspectionStatus.REPORT_GENERATED]: {
    label: "Report Ready",
    variant: "default",
    icon: FileText,
    description: "Inspection report has been generated",
  },
};

// ---------------------------------------------------------------------------
// Type config for UI display
// ---------------------------------------------------------------------------

export interface InspectionTypeConfig {
  label: string;
  icon: LucideIcon;
  description: string;
}

export const INSPECTION_TYPE_CONFIG: Record<
  InspectionType,
  InspectionTypeConfig
> = {
  [InspectionType.MOVE_IN]: {
    label: "Move-in",
    icon: LogIn,
    description: "Pre-move-in property condition check",
  },
  [InspectionType.PERIODIC]: {
    label: "Periodic",
    icon: RotateCcw,
    description: "Regular property condition check",
  },
  [InspectionType.MOVE_OUT]: {
    label: "Move-out",
    icon: LogOut,
    description: "Post-move-out condition assessment",
  },
  [InspectionType.EMERGENCY]: {
    label: "Emergency",
    icon: AlertTriangle,
    description: "Urgent inspection for damage or incident",
  },
};

// ---------------------------------------------------------------------------
// Condition config for UI display
// ---------------------------------------------------------------------------

export interface InspectionConditionConfig {
  label: string;
  variant: InspectionStatusVariant;
  color: string;
}

export const INSPECTION_CONDITION_CONFIG: Record<
  InspectionCondition,
  InspectionConditionConfig
> = {
  [InspectionCondition.EXCELLENT]: {
    label: "Excellent",
    variant: "default",
    color: "text-emerald-600",
  },
  [InspectionCondition.GOOD]: {
    label: "Good",
    variant: "default",
    color: "text-green-600",
  },
  [InspectionCondition.FAIR]: {
    label: "Fair",
    variant: "secondary",
    color: "text-amber-600",
  },
  [InspectionCondition.POOR]: {
    label: "Poor",
    variant: "outline",
    color: "text-orange-600",
  },
  [InspectionCondition.DAMAGED]: {
    label: "Damaged",
    variant: "destructive",
    color: "text-red-600",
  },
};

// ---------------------------------------------------------------------------
// Category config for UI display
// ---------------------------------------------------------------------------

export interface InspectionCategoryConfig {
  label: string;
  description: string;
}

export const INSPECTION_CATEGORY_CONFIG: Record<
  InspectionCategory,
  InspectionCategoryConfig
> = {
  [InspectionCategory.BEDROOM]: {
    label: "Bedroom",
    description: "Bedroom areas including walls, floors, windows",
  },
  [InspectionCategory.BATHROOM]: {
    label: "Bathroom",
    description: "Bathroom fixtures, plumbing, tiles",
  },
  [InspectionCategory.KITCHEN]: {
    label: "Kitchen",
    description: "Kitchen appliances, cabinets, countertops",
  },
  [InspectionCategory.LIVING]: {
    label: "Living Area",
    description: "Living room, dining area, hallways",
  },
  [InspectionCategory.EXTERIOR]: {
    label: "Exterior",
    description: "Doors, gates, parking, garden",
  },
  [InspectionCategory.OTHER]: {
    label: "Other",
    description: "Other areas or general items",
  },
};

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface InspectionItem {
  id: string;
  inspectionId: string;
  category: string;
  item: string;
  condition?: string;
  notes?: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTenancyRef {
  id: string;
  property?: {
    id: string;
    title: string;
    address?: string;
  };
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
  owner?: {
    id: string;
    name: string;
  };
}

export interface Inspection {
  id: string;

  // Context
  tenancyId: string;
  tenancy?: InspectionTenancyRef;

  // Inspection Details
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate?: string;
  scheduledTime?: string; // e.g. "10:00-12:00"

  // Video Inspection
  videoRequested: boolean;
  videoRequestedAt?: string;
  videoUrl?: string;
  videoSubmittedAt?: string;

  // Onsite Inspection
  onsiteRequired: boolean;
  onsiteDate?: string;
  onsiteInspector?: string;

  // Report
  reportUrl?: string;
  overallRating?: number; // 1-5
  notes?: string;

  // Completion
  completedAt?: string;
  completedBy?: string;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  checklist?: InspectionItem[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface InspectionFilters {
  tenancyId?: string;
  type?: InspectionType;
  status?: InspectionStatus | InspectionStatus[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InspectionFilterTab {
  value: string;
  label: string;
  statuses?: InspectionStatus[];
}

export const INSPECTION_FILTER_TABS: InspectionFilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "upcoming",
    label: "Upcoming",
    statuses: [InspectionStatus.SCHEDULED],
  },
  {
    value: "in-progress",
    label: "In Progress",
    statuses: [
      InspectionStatus.VIDEO_REQUESTED,
      InspectionStatus.VIDEO_SUBMITTED,
      InspectionStatus.ONSITE_PENDING,
    ],
  },
  {
    value: "completed",
    label: "Completed",
    statuses: [InspectionStatus.COMPLETED, InspectionStatus.REPORT_GENERATED],
  },
];

/**
 * Get statuses to filter by based on a filter tab value.
 */
export function getStatusesForInspectionFilter(
  filter: string
): InspectionStatus[] | undefined {
  const tab = INSPECTION_FILTER_TABS.find((t) => t.value === filter);
  return tab?.statuses;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface ScheduleInspectionDto {
  tenancyId: string;
  type: InspectionType;
  scheduledDate?: string;
  scheduledTime?: string;
  videoRequested?: boolean;
  onsiteRequired?: boolean;
  notes?: string;
}

export interface CompleteInspectionDto {
  overallRating: number; // 1-5
  notes?: string;
}

export interface UpdateChecklistDto {
  items: Array<{
    id?: string;
    category: string;
    item: string;
    condition?: string;
    notes?: string;
    photoUrls?: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Video Inspection DTOs
// ---------------------------------------------------------------------------

export interface RequestVideoDto {
  message?: string;
}

export interface SubmitVideoDto {
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

export interface SubmitVideoResponse {
  uploadUrl: string;
  expiresAt: string;
  inspection: Inspection;
}

export interface ReviewVideoDto {
  decision: "APPROVED" | "REQUEST_REDO";
  notes?: string;
}

export interface InspectionVideoUrlResponse {
  url: string;
}

// ---------------------------------------------------------------------------
// Video upload state
// ---------------------------------------------------------------------------

export type VideoUploadStage =
  | "idle"
  | "requesting"
  | "uploading"
  | "confirming"
  | "complete"
  | "error";

export interface VideoUploadProgress {
  stage: VideoUploadStage;
  percent: number;
  bytesUploaded: number;
  totalBytes: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helper: terminal status check
// ---------------------------------------------------------------------------

export function isTerminalInspectionStatus(status: InspectionStatus): boolean {
  return (
    status === InspectionStatus.COMPLETED ||
    status === InspectionStatus.REPORT_GENERATED
  );
}

/**
 * Check if the inspection allows video upload (tenant perspective).
 */
export function canUploadVideo(inspection: Inspection): boolean {
  return (
    inspection.videoRequested &&
    inspection.status === InspectionStatus.VIDEO_REQUESTED
  );
}

/**
 * Check if the inspection has a video ready for review (owner perspective).
 */
export function canReviewVideo(inspection: Inspection): boolean {
  return (
    inspection.status === InspectionStatus.VIDEO_SUBMITTED &&
    !!inspection.videoUrl
  );
}

// ---------------------------------------------------------------------------
// Time slots for scheduling
// ---------------------------------------------------------------------------

export const INSPECTION_TIME_SLOTS = [
  { value: "09:00-10:00", label: "9:00 AM - 10:00 AM" },
  { value: "10:00-11:00", label: "10:00 AM - 11:00 AM" },
  { value: "11:00-12:00", label: "11:00 AM - 12:00 PM" },
  { value: "12:00-13:00", label: "12:00 PM - 1:00 PM" },
  { value: "14:00-15:00", label: "2:00 PM - 3:00 PM" },
  { value: "15:00-16:00", label: "3:00 PM - 4:00 PM" },
  { value: "16:00-17:00", label: "4:00 PM - 5:00 PM" },
  { value: "17:00-18:00", label: "5:00 PM - 6:00 PM" },
];
