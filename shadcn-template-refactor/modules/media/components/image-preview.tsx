// =============================================================================
// ImagePreview â€” Image preview dialog with crop/rotate controls
// =============================================================================
// Displays a full-size preview of an image with basic editing controls:
// - Zoom in/out
// - Rotate 90Â° CW/CCW
// - Fit to screen
// Client-side only â€” no server processing required.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  X,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { formatFileSize } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ImagePreviewProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Image URL to preview */
  src: string;
  /** Image filename */
  filename: string;
  /** File size in bytes */
  fileSize?: number;
  /** Alt text */
  alt?: string;
  /** Image dimensions */
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ZOOM = 10;
const MAX_ZOOM = 300;
const ZOOM_STEP = 10;
const DEFAULT_ZOOM = 100;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImagePreview({
  open,
  onOpenChange,
  src,
  filename,
  fileSize,
  alt,
  width,
  height,
}: ImagePreviewProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [rotation, setRotation] = useState(0);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setZoom(DEFAULT_ZOOM);
        setRotation(0);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const fitToScreen = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setRotation(0);
  }, []);

  // Rotate controls
  const rotateCW = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const rotateCCW = useCallback(() => {
    setRotation((r) => (r - 90 + 360) % 360);
  }, []);

  // Build transform style
  const imageStyle = useMemo(
    () => ({
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      transition: "transform 0.2s ease-out",
    }),
    [zoom, rotation]
  );

  // Image info text
  const infoText = useMemo(() => {
    const parts: string[] = [];
    if (width && height) parts.push(`${width}Ã—${height}`);
    if (fileSize) parts.push(formatFileSize(fileSize));
    parts.push(`${zoom}%`);
    if (rotation !== 0) parts.push(`${rotation}Â°`);
    return parts.join(" Â· ");
  }, [width, height, fileSize, zoom, rotation]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-medium">
                {filename}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{infoText}</p>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Image container */}
        <div className="relative flex items-center justify-center overflow-hidden bg-muted/50 p-4" style={{ minHeight: "400px", maxHeight: "60vh" }}>
          <img
            src={src}
            alt={alt || filename}
            className="max-h-full max-w-full object-contain"
            style={imageStyle}
            draggable={false}
          />
        </div>

        {/* Controls toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </Button>

            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              className="w-28"
            />

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </Button>

            <span className="min-w-12 text-center text-xs text-muted-foreground">
              {zoom}%
            </span>
          </div>

          {/* Rotate + Fit */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={rotateCCW}
              title="Rotate counter-clockwise"
            >
              <RotateCcw className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={rotateCW}
              title="Rotate clockwise"
            >
              <RotateCw className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={fitToScreen}
              title="Fit to screen"
            >
              <Maximize2 className="size-3.5" />
            </Button>

            {/* Download link */}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              asChild
              title="Download"
            >
              <a href={src} download={filename} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

