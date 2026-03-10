# FRONTEND (WEB) — PART 31 — MAINTENANCE & INSPECTION UI

> **Sessions:** 7.1-7.5  
> **Covers:** Maintenance requests, inspection scheduling, video inspection

All rules from WEB PART 0–30 apply fully.

---

## 31.1 MAINTENANCE MODULE

### Module Structure
```
modules/maintenance/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-maintenance-requests.ts
│   ├── use-maintenance-request.ts
│   └── use-maintenance-mutations.ts
├── components/
│   ├── index.ts
│   ├── maintenance-request-form.tsx
│   ├── maintenance-card.tsx
│   ├── maintenance-list.tsx
│   ├── maintenance-detail.tsx
│   ├── maintenance-status-badge.tsx
│   ├── maintenance-timeline.tsx
│   └── maintenance-action-dialog.tsx
└── index.ts
```

### Maintenance Types

```typescript
// modules/maintenance/types/index.ts

export interface MaintenanceRequest {
  id: string;
  tenancyId: string;
  propertyId: string;
  requestedBy: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  status: MaintenanceStatus;
  assignedTo?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  estimatedCost?: number;
  actualCost?: number;
  media?: MediaItem[];
  notes?: MaintenanceNote[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  STRUCTURAL = 'STRUCTURAL',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  LANDSCAPING = 'LANDSCAPING',
  OTHER = 'OTHER',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatus {
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface MaintenanceNote {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}
```

---

## 31.2 MAINTENANCE BACKEND ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/maintenance-requests` | List requests |
| GET | `/api/v1/maintenance-requests/:id` | Get request detail |
| POST | `/api/v1/maintenance-requests` | Create request |
| PATCH | `/api/v1/maintenance-requests/:id` | Update request |
| POST | `/api/v1/maintenance-requests/:id/assign` | Assign to vendor |
| POST | `/api/v1/maintenance-requests/:id/complete` | Mark complete |
| POST | `/api/v1/maintenance-requests/:id/cancel` | Cancel request |
| POST | `/api/v1/maintenance-requests/:id/notes` | Add note |
| GET | `/api/v1/maintenance-requests/:id/timeline` | Get timeline |

---

## 31.3 MAINTENANCE REQUEST FORM

### Route
```
app/dashboard/(auth)/occupant/maintenance/new/
└── page.tsx    → NewMaintenanceRequestPage
```

### Form Component
```tsx
// modules/maintenance/components/maintenance-request-form.tsx

const maintenanceSchema = z.object({
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(MaintenancePriority),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(1000),
  preferredDate: z.date().optional(),
  media: z.array(z.string()).optional(), // Media IDs
});

interface MaintenanceRequestFormProps {
  tenancyId: string;
  onSuccess: (request: MaintenanceRequest) => void;
}

export function MaintenanceRequestForm({ tenancyId, onSuccess }: MaintenanceRequestFormProps) {
  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      priority: MaintenancePriority.MEDIUM,
    },
  });

  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const createRequest = useCreateMaintenanceRequest();

  const onSubmit = async (data: z.infer<typeof maintenanceSchema>) => {
    const request = await createRequest.mutateAsync({
      tenancyId,
      ...data,
      media: uploadedMedia,
    });
    onSuccess(request);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(MaintenanceCategory).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {maintenanceCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {Object.values(MaintenancePriority).map(p => (
                    <div key={p} className="flex items-center gap-2">
                      <RadioGroupItem value={p} id={p} />
                      <Label htmlFor={p}>{p}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Brief description of the issue" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={5}
                  placeholder="Describe the issue in detail..."
                />
              </FormControl>
              <FormDescription>
                Include when the issue started, affected areas, and any relevant details.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos/Videos (Optional)</Label>
          <MediaUploader
            maxFiles={5}
            accept="image/*,video/*"
            onUpload={(ids) => setUploadedMedia(prev => [...prev, ...ids])}
            onRemove={(id) => setUploadedMedia(prev => prev.filter(m => m !== id))}
          />
          <p className="text-sm text-muted-foreground">
            Upload photos or videos of the issue to help with diagnosis.
          </p>
        </div>

        {/* Preferred Date */}
        <FormField
          control={form.control}
          name="preferredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Visit Date (Optional)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  minDate={addDays(new Date(), 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createRequest.isPending}
        >
          {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 31.4 OWNER MAINTENANCE INBOX

### Route
```
app/dashboard/(auth)/account/maintenance/
├── page.tsx            → OwnerMaintenanceInbox
└── [id]/
    └── page.tsx       → MaintenanceDetailPage
```

### Inbox Component
```tsx
export default function OwnerMaintenanceInbox() {
  const [status, setStatus] = useState<MaintenanceStatus | 'all'>('all');
  const { data, isLoading } = useMaintenanceRequests({
    status: status === 'all' ? undefined : status,
    role: 'owner',
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Maintenance Requests" 
        description="Manage maintenance requests for your properties"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Pending" value={data?.stats?.pending || 0} icon={Clock} />
        <StatsCard title="In Progress" value={data?.stats?.inProgress || 0} icon={Wrench} />
        <StatsCard title="Awaiting Approval" value={data?.stats?.pendingApproval || 0} icon={AlertCircle} />
        <StatsCard title="Completed" value={data?.stats?.completed || 0} icon={CheckCircle} />
      </div>

      {/* Filter Tabs */}
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="SUBMITTED">New</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="PENDING_APPROVAL">Approval Needed</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Request List */}
      <MaintenanceList 
        requests={data?.items || []} 
        isLoading={isLoading}
        onAction={(request, action) => handleAction(request, action)}
      />
    </div>
  );
}
```

---

## 31.5 INSPECTION MODULE

### Module Structure
```
modules/inspection/
├── types/index.ts
├── hooks/
│   ├── index.ts
│   ├── use-inspections.ts
│   ├── use-inspection.ts
│   └── use-inspection-mutations.ts
├── components/
│   ├── index.ts
│   ├── inspection-scheduler.tsx
│   ├── inspection-card.tsx
│   ├── inspection-detail.tsx
│   ├── inspection-status-badge.tsx
│   ├── inspection-report-form.tsx
│   └── video-inspection-room.tsx
└── index.ts
```

### Inspection Types

```typescript
// modules/inspection/types/index.ts

export interface Inspection {
  id: string;
  tenancyId: string;
  propertyId: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledAt: Date;
  completedAt?: Date;
  inspectorId?: string;
  inspectorName?: string;
  report?: InspectionReport;
  videoSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InspectionType {
  MOVE_IN = 'MOVE_IN',
  MOVE_OUT = 'MOVE_OUT',
  PERIODIC = 'PERIODIC',
  COMPLAINT = 'COMPLAINT',
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface InspectionReport {
  id: string;
  inspectionId: string;
  overallCondition: ConditionRating;
  areas: InspectionArea[];
  notes: string;
  media: MediaItem[];
  createdAt: Date;
}

export interface InspectionArea {
  name: string;
  condition: ConditionRating;
  notes?: string;
  issues?: string[];
}

export enum ConditionRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}
```

---

## 31.6 INSPECTION SCHEDULER

```tsx
// modules/inspection/components/inspection-scheduler.tsx

interface InspectionSchedulerProps {
  tenancyId: string;
  type: InspectionType;
  onScheduled: (inspection: Inspection) => void;
}

export function InspectionScheduler({ tenancyId, type, onScheduled }: InspectionSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<string>();

  const { data: availableSlots } = useAvailableInspectionSlots(selectedDate);
  const scheduleInspection = useScheduleInspection();

  const handleSchedule = async () => {
    if (!selectedDate || !selectedSlot) return;

    const inspection = await scheduleInspection.mutateAsync({
      tenancyId,
      type,
      scheduledAt: combineDateTime(selectedDate, selectedSlot),
    });
    onScheduled(inspection);
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div>
        <Label>Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => 
            date < addDays(new Date(), 1) || 
            date > addDays(new Date(), 30) ||
            isWeekend(date)
          }
          className="rounded-md border"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <Label>Select Time Slot</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {availableSlots?.map(slot => (
              <Button
                key={slot.time}
                variant={selectedSlot === slot.time ? 'default' : 'outline'}
                size="sm"
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSchedule}
        disabled={!selectedDate || !selectedSlot || scheduleInspection.isPending}
        className="w-full"
      >
        {scheduleInspection.isPending ? 'Scheduling...' : 'Schedule Inspection'}
      </Button>
    </div>
  );
}
```

---

## 31.7 VIDEO INSPECTION ROOM

```tsx
// modules/inspection/components/video-inspection-room.tsx

interface VideoInspectionRoomProps {
  inspection: Inspection;
  role: 'inspector' | 'occupant';
  onEnd: () => void;
}

export function VideoInspectionRoom({ inspection, role, onEnd }: VideoInspectionRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // WebRTC setup would go here
  // For MVP, can use a third-party service like Daily.co or Twilio

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (large) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (small overlay) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
          <video autoPlay muted playsInline className="w-full h-full object-cover" />
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Connecting to video call...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="icon"
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            onClick={onEnd}
          >
            <PhoneOff className="mr-2 h-5 w-5" /> End Call
          </Button>

          {role === 'inspector' && (
            <Button variant="secondary">
              <Camera className="mr-2 h-5 w-5" /> Capture Photo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 31.8 INSPECTION REPORT FORM

```tsx
// modules/inspection/components/inspection-report-form.tsx

const reportSchema = z.object({
  overallCondition: z.nativeEnum(ConditionRating),
  areas: z.array(z.object({
    name: z.string(),
    condition: z.nativeEnum(ConditionRating),
    notes: z.string().optional(),
    issues: z.array(z.string()).optional(),
  })),
  notes: z.string().max(2000),
});

const defaultAreas = [
  'Living Room', 'Kitchen', 'Bedroom 1', 'Bedroom 2', 
  'Bathroom', 'Balcony', 'Exterior'
];

interface InspectionReportFormProps {
  inspection: Inspection;
  onSubmit: (report: InspectionReport) => void;
}

export function InspectionReportForm({ inspection, onSubmit }: InspectionReportFormProps) {
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      areas: defaultAreas.map(name => ({ name, condition: ConditionRating.GOOD })),
      notes: '',
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'areas',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Overall Condition */}
        <FormField
          control={form.control}
          name="overallCondition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Property Condition</FormLabel>
              <FormControl>
                <ConditionRatingSelect {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Area-by-Area Assessment */}
        <div className="space-y-4">
          <Label>Area Assessment</Label>
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base">{field.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name={`areas.${index}.condition`}
                  render={({ field }) => (
                    <ConditionRatingSelect {...field} />
                  )}
                />
                <FormField
                  control={form.control}
                  name={`areas.${index}.notes`}
                  render={({ field }) => (
                    <Textarea {...field} placeholder="Notes for this area" rows={2} />
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* General Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder="Any additional observations..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Submit Inspection Report
        </Button>
      </form>
    </Form>
  );
}
```

---

## 31.9 HOOKS SPECIFICATION

```typescript
// modules/maintenance/hooks/

export function useMaintenanceRequests(params: MaintenanceQueryParams = {}) {
  return useApiPaginatedQuery<MaintenanceRequest>(
    queryKeys.maintenance.list(params),
    `/maintenance-requests`,
    { params, staleTime: 30_000 }
  );
}

export function useMaintenanceRequest(id: string | undefined) {
  return useApiQuery<MaintenanceRequest>(
    queryKeys.maintenance.detail(id!),
    `/maintenance-requests/${id}`,
    { enabled: !!id }
  );
}

export function useCreateMaintenanceRequest() {
  return useApiMutation<MaintenanceRequest, CreateMaintenanceDto>({
    method: 'POST',
    endpoint: '/maintenance-requests',
    invalidateKeys: [queryKeys.maintenance.all],
    successMessage: 'Maintenance request submitted',
  });
}

// modules/inspection/hooks/

export function useInspections(params: InspectionQueryParams = {}) {
  return useApiPaginatedQuery<Inspection>(
    queryKeys.inspections.list(params),
    `/inspections`,
    { params }
  );
}

export function useScheduleInspection() {
  return useApiMutation<Inspection, ScheduleInspectionDto>({
    method: 'POST',
    endpoint: '/inspections',
    invalidateKeys: [queryKeys.inspections.all],
    successMessage: 'Inspection scheduled',
  });
}
```

---

## 31.10 QUERY KEYS

```typescript
// lib/query/index.ts (extend)

maintenance: {
  all: ['maintenance'] as const,
  list: (params: MaintenanceQueryParams) => ['maintenance', 'list', params] as const,
  detail: (id: string) => ['maintenance', 'detail', id] as const,
  timeline: (id: string) => ['maintenance', 'timeline', id] as const,
  byTenancy: (tenancyId: string) => ['maintenance', 'tenancy', tenancyId] as const,
},

inspections: {
  all: ['inspections'] as const,
  list: (params: InspectionQueryParams) => ['inspections', 'list', params] as const,
  detail: (id: string) => ['inspections', 'detail', id] as const,
  slots: (date: string) => ['inspections', 'slots', date] as const,
  byTenancy: (tenancyId: string) => ['inspections', 'tenancy', tenancyId] as const,
},
```
