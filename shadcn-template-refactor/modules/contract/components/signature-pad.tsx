// =============================================================================
// SignaturePad — Canvas-based signature input with typed alternative
// =============================================================================
// Allows users to draw their signature on canvas or type their name.
// Outputs base64 image data for storage.
// =============================================================================

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Pen, Type, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignatureData {
  /** Base64 encoded signature image (PNG) */
  imageData?: string;
  /** Typed name as signature */
  typedName?: string;
  /** Which method was used */
  method: "draw" | "type";
}

interface SignaturePadProps {
  /** Callback when signature changes */
  onChange?: (data: SignatureData | null) => void;
  /** Initial typed name value */
  initialName?: string;
  /** Width of the signature pad */
  width?: number;
  /** Height of the signature pad */
  height?: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Placeholder for typed signature */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// SignaturePad Component
// ---------------------------------------------------------------------------

export function SignaturePad({
  onChange,
  initialName = "",
  width = 400,
  height = 150,
  strokeColor = "#000000",
  strokeWidth = 2,
  placeholder = "Type your full legal name",
  disabled = false,
}: SignaturePadProps) {
  const [activeTab, setActiveTab] = useState<"draw" | "type">("type");
  const [typedName, setTypedName] = useState(initialName);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas internal dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    contextRef.current = ctx;

    // Clear and set background
    clearCanvas();
  }, [width, height, strokeColor, strokeWidth]);

  // Emit change when signature method or content changes
  useEffect(() => {
    if (activeTab === "type") {
      if (typedName.trim()) {
        onChange?.({
          typedName: typedName.trim(),
          method: "type",
        });
      } else {
        onChange?.(null);
      }
    } else {
      if (hasDrawn) {
        const canvas = canvasRef.current;
        if (canvas) {
          onChange?.({
            imageData: canvas.toDataURL("image/png"),
            method: "draw",
          });
        }
      } else {
        onChange?.(null);
      }
    }
  }, [activeTab, typedName, hasDrawn, onChange]);

  // Clear canvas to white background
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
    historyRef.current = [];
  }, [width, height]);

  // Save canvas state for undo
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(imageData);
    // Keep only last 10 states
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }
  }, []);

  // Undo last stroke
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || historyRef.current.length === 0) return;

    historyRef.current.pop(); // Remove current state
    if (historyRef.current.length > 0) {
      const previousState = historyRef.current[historyRef.current.length - 1];
      ctx.putImageData(previousState, 0, 0);
    } else {
      clearCanvas();
    }

    // Check if canvas is empty
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isBlank = isCanvasBlank(imageData);
    setHasDrawn(!isBlank);
  }, [clearCanvas]);

  // Check if canvas is blank (all white)
  const isCanvasBlank = (imageData: ImageData): boolean => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Check if any pixel is not white
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        return false;
      }
    }
    return true;
  };

  // Get coordinates from mouse/touch event
  const getCoordinates = useCallback(
    (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // Start drawing
  const startDrawing = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      event.preventDefault();
      saveState();
      isDrawingRef.current = true;
      lastPointRef.current = getCoordinates(event);
    },
    [disabled, getCoordinates, saveState]
  );

  // Draw on canvas
  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current || disabled) return;

      event.preventDefault();
      const ctx = contextRef.current;
      if (!ctx || !lastPointRef.current) return;

      const currentPoint = getCoordinates(event);

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      lastPointRef.current = currentPoint;
      setHasDrawn(true);
    },
    [disabled, getCoordinates]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  // Handle typed name change
  const handleTypedNameChange = (value: string) => {
    setTypedName(value);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "draw" | "type");
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="type" disabled={disabled} className="gap-2">
            <Type className="h-4 w-4" />
            Type Name
          </TabsTrigger>
          <TabsTrigger value="draw" disabled={disabled} className="gap-2">
            <Pen className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="type" className="mt-4">
          <div className="space-y-3">
            <Label htmlFor="typed-signature">Your Full Legal Name</Label>
            <Input
              id="typed-signature"
              value={typedName}
              onChange={(e) => handleTypedNameChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="text-lg"
            />
            {typedName.trim() && (
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Signature Preview:
                </p>
                <p
                  className="text-2xl"
                  style={{ fontFamily: "'Great Vibes', cursive, serif" }}
                >
                  {typedName}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="draw" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Draw Your Signature</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={disabled || historyRef.current.length === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  disabled={disabled || !hasDrawn}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "relative rounded-md border-2 border-dashed bg-white dark:bg-slate-950",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "cursor-crosshair"
              )}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="touch-none"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                }}
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Sign here using your mouse or touchscreen
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use your mouse, finger, or stylus to draw your signature above
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typed Signature Preview (for display purposes)
// ---------------------------------------------------------------------------

interface TypedSignaturePreviewProps {
  name: string;
  className?: string;
}

export function TypedSignaturePreview({ name, className }: TypedSignaturePreviewProps) {
  return (
    <span
      className={cn("text-2xl", className)}
      style={{ fontFamily: "'Great Vibes', cursive, serif" }}
    >
      {name}
    </span>
  );
}

export default SignaturePad;
