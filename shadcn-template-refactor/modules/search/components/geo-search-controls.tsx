// =============================================================================
// GeoSearchControls — Browser geolocation + radius slider
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { Locate, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

import type { SearchParams } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GeoSearchControlsProps {
  params: SearchParams;
  onParamsChange: (newParams: Partial<SearchParams>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GeoSearchControls({
  params,
  onParamsChange,
}: GeoSearchControlsProps) {
  const [isLocating, setIsLocating] = useState(false);
  const isActive = params.lat != null && params.lng != null;

  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onParamsChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: params.radius || 10,
          page: 1,
        });
        setIsLocating(false);
        toast.success("Location updated — showing nearby listings");
      },
      () => {
        setIsLocating(false);
        toast.error(
          "Unable to get your location. Please check browser permissions.",
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }, [params.radius, onParamsChange]);

  const handleRadiusChange = useCallback(
    (values: number[]) => {
      if (isActive) {
        onParamsChange({ radius: values[0], page: 1 });
      }
    },
    [isActive, onParamsChange],
  );

  const handleClear = useCallback(() => {
    onParamsChange({
      lat: undefined,
      lng: undefined,
      radius: undefined,
      page: 1,
    });
  }, [onParamsChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLocating}
        >
          <Locate className="mr-2 h-4 w-4" />
          {isLocating
            ? "Locating..."
            : isActive
              ? "Location active"
              : "Use my location"}
        </Button>

        {isActive && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {isActive && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Search radius: {params.radius || 10} km
          </label>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[params.radius || 10]}
            onValueChange={handleRadiusChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}
    </div>
  );
}
