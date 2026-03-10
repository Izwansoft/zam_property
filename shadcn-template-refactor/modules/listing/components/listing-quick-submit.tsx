"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import { useCreateListing } from "@/modules/listing/hooks/use-listing-mutations";
import type { Vendor } from "@/modules/vendor/types";

interface ListingQuickSubmitProps {
  vendors: Vendor[];
  title?: string;
  description?: string;
}

export function ListingQuickSubmit({
  vendors,
  title = "Submit Listing Draft",
  description = "Create a listing draft for partner approval.",
}: ListingQuickSubmitProps) {
  const createMutation = useCreateListing();

  const [vendorId, setVendorId] = useState<string>(vendors[0]?.id ?? "");
  const [listingTitle, setListingTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [price, setPrice] = useState<string>("100000");

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === vendorId),
    [vendors, vendorId],
  );

  const handleSubmit = async () => {
    if (!vendorId) {
      showError("Please select a vendor.");
      return;
    }

    if (!listingTitle.trim()) {
      showError("Listing title is required.");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      showError("Please enter a valid price.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        vendorId,
        verticalType: selectedVendor?.verticalType ?? "real_estate",
        schemaVersion: "1.0",
        title: listingTitle.trim(),
        description: listingDescription.trim() || undefined,
        price: priceNumber,
        currency: "MYR",
        location: { country: "MY" },
        attributes: {},
      });

      showSuccess("Listing submitted as draft for partner approval.");
      setListingTitle("");
      setListingDescription("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit listing.";
      showError(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Price (MYR)</Label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min={1}
              step="1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Listing Title</Label>
          <Input
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
            placeholder="e.g., 2-bedroom serviced apartment in KLCC"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={listingDescription}
            onChange={(e) => setListingDescription(e.target.value)}
            placeholder="Add key highlights for partner reviewers"
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || vendors.length === 0}
        >
          {createMutation.isPending ? "Submitting..." : "Submit Draft"}
        </Button>
      </CardContent>
    </Card>
  );
}
