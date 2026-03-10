// =============================================================================
// Platform Jobs — Client Content
// =============================================================================
// Main job queue dashboard with tabs for Health, Jobs, and Bulk Operations.
// Includes an auto-refresh toggle that passes pollingEnabled to child components.
// =============================================================================

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QueueHealthDashboard } from "@/modules/jobs/components/queue-health-dashboard";
import { JobList } from "@/modules/jobs/components/job-list";
import { BulkOperations } from "@/modules/jobs/components/bulk-operations";

export function PlatformJobsContent() {
  const [activeTab, setActiveTab] = useState("health");
  const [pollingEnabled, setPollingEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Job Queue Dashboard"
          description="Monitor background job queues, retry failed jobs, and trigger bulk operations."
        />

        <div className="flex items-center gap-2 pt-1">
          <Switch
            id="auto-refresh"
            checked={pollingEnabled}
            onCheckedChange={setPollingEnabled}
          />
          <Label htmlFor="auto-refresh" className="text-sm whitespace-nowrap">
            Auto-refresh (10s)
          </Label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health">Health Dashboard</TabsTrigger>
          <TabsTrigger value="jobs">Job List</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <QueueHealthDashboard pollingEnabled={pollingEnabled} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <JobList pollingEnabled={pollingEnabled} />
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <BulkOperations />
        </TabsContent>
      </Tabs>
    </div>
  );
}
