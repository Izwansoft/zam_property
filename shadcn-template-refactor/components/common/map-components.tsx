/**
 * Map Components — Google Maps wrappers
 *
 * Client components for rendering Google Maps.
 * Used in both search results (multi-pin) and listing detail (single pin).
 *
 * @see https://visgl.github.io/react-google-maps/
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price?: string;
  href?: string;
}

interface ListingMapProps {
  /** Center latitude */
  lat: number;
  /** Center longitude */
  lng: number;
  /** Zoom level (default 15) */
  zoom?: number;
  /** Height CSS value */
  height?: string;
  /** Single pin label */
  title?: string;
}

interface SearchMapProps {
  /** Array of pins to render */
  pins: MapPin[];
  /** Height CSS value */
  height?: string;
  /** Callback when a pin is clicked */
  onPinClick?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// FitBounds helper — auto-fits map to all pins
// ---------------------------------------------------------------------------

function FitBoundsHelper({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  const fitted = useRef(false);
  const prevLength = useRef(pins.length);

  useEffect(() => {
    if (!map || pins.length === 0) return;

    // Reset fitted flag when pins change substantially
    if (pins.length !== prevLength.current) {
      fitted.current = false;
      prevLength.current = pins.length;
    }

    if (fitted.current) return;

    const bounds = new google.maps.LatLngBounds();
    pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });

    // Limit max zoom after fitBounds
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 14) {
        map.setZoom(14);
      }
    });

    fitted.current = true;

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [pins, map]);

  return null;
}

// ---------------------------------------------------------------------------
// ListingMap — Single pin for listing detail
// ---------------------------------------------------------------------------

export function ListingMap({
  lat,
  lng,
  zoom = 15,
  height = "300px",
  title,
}: ListingMapProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={zoom}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          mapId="listing-map"
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker
            position={{ lat, lng }}
            onClick={() => setInfoOpen(true)}
          />
          {title && infoOpen && (
            <InfoWindow
              position={{ lat, lng }}
              onCloseClick={() => setInfoOpen(false)}
            >
              <p className="text-sm font-semibold">{title}</p>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SearchMap — Multiple pins for search results
// ---------------------------------------------------------------------------

export function SearchMap({
  pins,
  height = "500px",
  onPinClick,
}: SearchMapProps) {
  // Default center: Kuala Lumpur
  const defaultCenter = { lat: 3.139, lng: 101.6869 };

  const [activePin, setActivePin] = useState<MapPin | null>(null);

  const handleMarkerClick = useCallback(
    (pin: MapPin) => {
      setActivePin(pin);
    },
    [],
  );

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-lg border">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="search-map"
          style={{ width: "100%", height: "100%" }}
        >
          {pins.length > 0 && <FitBoundsHelper pins={pins} />}
          {pins.map((pin) => (
            <AdvancedMarker
              key={pin.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              onClick={() => handleMarkerClick(pin)}
            />
          ))}
          {activePin && (
            <InfoWindow
              position={{ lat: activePin.lat, lng: activePin.lng }}
              onCloseClick={() => setActivePin(null)}
            >
              <div className="min-w-40">
                <p className="text-sm font-semibold">{activePin.title}</p>
                {activePin.price && (
                  <p className="text-sm font-medium text-primary">
                    {activePin.price}
                  </p>
                )}
                {activePin.href && (
                  <a
                    href={activePin.href}
                    className="text-xs text-blue-600 underline"
                    onClick={(e) => {
                      if (onPinClick) {
                        e.preventDefault();
                        onPinClick(activePin.id);
                      }
                    }}
                  >
                    View listing
                  </a>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

