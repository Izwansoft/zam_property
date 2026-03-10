// =============================================================================
// Platform Pricing — Client Content
// =============================================================================
// Main pricing management page with tabs for configs, rules, events, calculator.
// =============================================================================

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingConfigList } from "@/modules/pricing/components/pricing-config-list";
import { PricingRulesList } from "@/modules/pricing/components/pricing-rules-list";
import { ChargeEventsList } from "@/modules/pricing/components/charge-events-list";
import { ChargeCalculator } from "@/modules/pricing/components/charge-calculator";

export function PlatformPricingContent() {
  const [activeTab, setActiveTab] = useState("configs");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Management"
        description="Configure pricing models, rules, and view charge events for vendor billing."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configs">Pricing Configs</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="events">Charge Events</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="mt-4">
          <PricingConfigList />
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <PricingRulesList />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <ChargeEventsList />
        </TabsContent>

        <TabsContent value="calculator" className="mt-4">
          <ChargeCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
