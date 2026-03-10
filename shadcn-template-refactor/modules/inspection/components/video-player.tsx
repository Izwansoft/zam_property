// =============================================================================
// VideoPlayer — Video playback component for inspection videos
// =============================================================================
// Supports presigned URL playback, loading states, and responsive sizing.
// =============================================================================

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Maximize2,
  Volume2,
  VolumeX,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoPlayerProps {
  /** Presigned video URL */
  src: string | undefined;
  /** Title shown above the player */
  title?: string;
  /** Whether the video URL is loading */
  isLoading?: boolean;
  /** Error loading the video URL */
  error?: { message?: string } | null;
  /** Show download button */
  showDownload?: boolean;
  /** Additional class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoPlayer({
  src,
  title = "Inspection Video",
  isLoading = false,
  error = null,
  showDownload = true,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = "inspection-video";
    a.target = "_blank";
    a.click();
  }, [src]);

  // Loading state
  if (isLoading) {
    return <VideoPlayerSkeleton title={title} className={className} />;
  }

  // Error fetching URL
  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">
              Failed to load video
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message || "Unable to retrieve video URL."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No video available
  if (!src) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-8 text-center">
            <Play className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No video available yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {showDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="mr-1 h-3.5 w-3.5" />
              Download
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg bg-black">
          {/* Loading overlay */}
          {isVideoLoading && !hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {/* Error overlay */}
          {hasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
              <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm text-white">
                Failed to load video
              </p>
              <p className="mt-1 text-xs text-white/60">
                The video may have expired. Please refresh the page.
              </p>
            </div>
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            src={src}
            className="aspect-video w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={() => setIsVideoLoading(false)}
            onError={() => {
              setHasError(true);
              setIsVideoLoading(false);
            }}
            playsInline
            preload="metadata"
          />

          {/* Controls overlay */}
          {!hasError && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function VideoPlayerSkeleton({
  title = "Inspection Video",
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
