"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useCompanies } from "@/modules/company/hooks/useCompany";
import { useAgents } from "@/modules/agent/hooks/useAgents";
import {
  useCreateVendor,
  type CreateVendorDto,
} from "@/modules/vendor/hooks/use-vendor-mutations";

export type VendorProfileModel =
  | "COMPANY"
  | "PROPERTY_OWNER"
  | "INDIVIDUAL_AGENT"
  | "AGENT_UNDER_COMPANY";

interface FormValues {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  verticalType?: string;
  description?: string;
}

interface CreateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verticalOptions: Array<{ label: string; value: string }>;
}

const PROFILE_OPTIONS: Array<{ value: VendorProfileModel; label: string; helper: string }> = [
  {
    value: "COMPANY",
    label: "Company",
    helper: "Agency or management company profile",
  },
  {
    value: "PROPERTY_OWNER",
    label: "Vendor (Property Owner)",
    helper: "Individual landlord/property owner",
  },
  {
    value: "INDIVIDUAL_AGENT",
    label: "Individual Agent",
    helper: "Independent agent not linked to a company",
  },
  {
    value: "AGENT_UNDER_COMPANY",
    label: "Agent Under Company",
    helper: "Agent profile associated with an existing company",
  },
];

export function CreateVendorDialog({
  open,
  onOpenChange,
  verticalOptions,
}: CreateVendorDialogProps) {
  const createVendor = useCreateVendor();

  const [profileModel, setProfileModel] = useState<VendorProfileModel>("COMPANY");
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      verticalType: "",
      description: "",
    },
  });

  const { data: companiesData } = useCompanies({
    page: 1,
    pageSize: 20,
    search: companySearch || undefined,
  });

  const companies = companiesData?.items ?? [];

  const { data: agentsData } = useAgents({
    page: 1,
    limit: 50,
    companyId: selectedCompanyId || undefined,
  });

  const agents = agentsData?.items ?? [];

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId),
    [agents, selectedAgentId],
  );

  const handleModelChange = (value: VendorProfileModel) => {
    setProfileModel(value);
    setSelectedCompanyId("");
    setSelectedAgentId("");
  };

  const closeAndReset = () => {
    onOpenChange(false);
    reset();
    setProfileModel("COMPANY");
    setCompanySearch("");
    setSelectedCompanyId("");
    setSelectedAgentId("");
  };

  const onSubmit = async (values: FormValues) => {
    const vendorType = profileModel === "COMPANY" ? "COMPANY" : "INDIVIDUAL";

    const metadataNotes: string[] = [];

    if (profileModel === "PROPERTY_OWNER") {
      metadataNotes.push("Profile Model: Property Owner");
    }
    if (profileModel === "INDIVIDUAL_AGENT") {
      metadataNotes.push("Profile Model: Individual Agent");
    }
    if (profileModel === "AGENT_UNDER_COMPANY") {
      metadataNotes.push("Profile Model: Agent Under Company");
      if (selectedCompany?.name) metadataNotes.push(`Company: ${selectedCompany.name}`);
      if (selectedAgent?.user?.fullName) metadataNotes.push(`Agent: ${selectedAgent.user.fullName}`);
    }

    const description = [values.description, ...metadataNotes]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    const payload: CreateVendorDto = {
      name: values.name.trim(),
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      website: values.website?.trim() || undefined,
      verticalType: values.verticalType || undefined,
      description: description || undefined,
      vendorType,
    };

    await createVendor.mutateAsync(payload);
    closeAndReset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : closeAndReset())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Vendor</DialogTitle>
          <DialogDescription>
            New vendors are created in PENDING status and must be reviewed in the Vendor Applications table.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Vendor Profile Type</Label>
            <Select value={profileModel} onValueChange={(value) => handleModelChange(value as VendorProfileModel)}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor profile" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PROFILE_OPTIONS.find((x) => x.value === profileModel)?.helper}
            </p>
          </div>

          {profileModel === "AGENT_UNDER_COMPANY" && (
            <div className="rounded-md border p-3 space-y-3">
              <Label htmlFor="company-search">Find Company</Label>
              <Input
                id="company-search"
                placeholder="Type company name..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
              />

              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedAgentId}
                onValueChange={(value) => {
                  setSelectedAgentId(value);
                  const agent = agents.find((item) => item.id === value);
                  if (agent?.user?.fullName && !watch("name")) {
                    setValue("name", agent.user.fullName);
                  }
                  if (agent?.user?.email && !watch("email")) {
                    setValue("email", agent.user.email);
                  }
                }}
                disabled={!selectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent under company" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.user?.fullName ?? agent.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Current backend stores vendor as a vendor entity. Company/agent linkage is captured as metadata for now.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Display Name *</Label>
              <Input id="vendor-name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-vertical">Vertical</Label>
              <Select
                value={watch("verticalType") || ""}
                onValueChange={(value) => setValue("verticalType", value)}
              >
                <SelectTrigger id="vendor-vertical">
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-email">Email</Label>
              <Input id="vendor-email" type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" {...register("phone")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendor-website">Website</Label>
              <Input id="vendor-website" {...register("website")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendor-description">Description / Notes</Label>
              <Textarea id="vendor-description" rows={3} {...register("description")} />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <Badge variant="outline">Flow</Badge>
            Submit -&gt; PENDING -&gt; Review in applications table -&gt; Approve/Reject
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVendor.isPending}>
              {createVendor.isPending ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
