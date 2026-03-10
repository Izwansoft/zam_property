/**
 * OptimizedImage Component
 *
 * Wraps Next.js Image with performance best practices:
 * - LQIP (Low Quality Image Placeholder) blur
 * - Lazy loading by default (below-the-fold)
 * - Aspect ratio wrapper to prevent CLS
 * - AVIF/WebP format preference via Next.js config
 * - Responsive sizes based on breakpoints
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/listing-hero.jpg"
 *   alt="Modern apartment in KL"
 *   width={800}
 *   height={600}
 *   priority  // for above-the-fold images (hero, LCP candidate)
 * />
 * ```
 *
 * @see docs/ai-prompt/part-17.md §17.7 — Image & Media Performance
 */
'use client';

import React, { useState } from 'react';
import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizedImageProps extends Omit<NextImageProps, 'onLoad'> {
  /** Aspect ratio for the container (e.g., '16/9', '4/3', '1/1'). Prevents CLS. */
  aspectRatio?: string;
  /** Show a shimmer/skeleton placeholder while loading. Default: true */
  showPlaceholder?: boolean;
  /** Custom placeholder color. Default: uses muted theme color */
  placeholderColor?: string;
  /** Container className */
  containerClassName?: string;
  /** Callback when image finishes loading */
  onLoad?: () => void;
  /** Fallback src if the image fails to load */
  fallbackSrc?: string;
}

// ---------------------------------------------------------------------------
// Responsive Sizes Presets
// ---------------------------------------------------------------------------

/**
 * Common responsive sizes for different layout contexts.
 * Helps Next.js generate optimally-sized images.
 */
export const IMAGE_SIZES = {
  /** Full-width hero image */
  hero: '100vw',
  /** Card in a responsive grid (1-col mobile, 2-col tablet, 3-col desktop) */
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  /** Gallery thumbnail in a grid */
  thumbnail: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw',
  /** Avatar / small icon */
  avatar: '48px',
  /** Sidebar or narrow column */
  sidebar: '(max-width: 1024px) 100vw, 320px',
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  priority = false,
  sizes,
  aspectRatio,
  showPlaceholder = true,
  placeholderColor,
  containerClassName,
  className,
  onLoad,
  fallbackSrc,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    // If we have a fallback, don't show error state
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

  // Default sizes based on whether fill mode is used
  const defaultSizes = fill ? IMAGE_SIZES.card : undefined;

  const imageElement = (
    <NextImage
      src={imageSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes ?? defaultSizes}
      className={cn(
        'transition-opacity duration-300',
        !isLoaded && showPlaceholder && 'opacity-0',
        isLoaded && 'opacity-100',
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );

  // Wrap with aspect ratio container if specified
  if (aspectRatio || fill) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          containerClassName
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {/* Placeholder shimmer */}
        {showPlaceholder && !isLoaded && (
          <div
            className={cn(
              'absolute inset-0 animate-pulse rounded',
              placeholderColor ?? 'bg-muted'
            )}
            aria-hidden="true"
          />
        )}
        {imageElement}
      </div>
    );
  }

  // Without aspect ratio — just render with optional placeholder
  if (showPlaceholder && !isLoaded) {
    return (
      <span className={cn('relative inline-block', containerClassName)}>
        <span
          className={cn(
            'absolute inset-0 animate-pulse rounded',
            placeholderColor ?? 'bg-muted'
          )}
          aria-hidden="true"
          style={{ width: width as number, height: height as number }}
        />
        {imageElement}
      </span>
    );
  }

  return imageElement;
}
