/**
 * Accessibility Utilities — Barrel Export
 *
 * WCAG 2.1 AA compliant utilities for keyboard navigation,
 * screen reader announcements, focus management, and more.
 *
 * @see docs/ai-prompt/part-21.md — Accessibility Deep Dive
 */

// --- Hooks ---
export { useReducedMotion } from './hooks/use-reduced-motion';
export { useAnnounce } from './hooks/use-announce';
export { useFocusTrap } from './hooks/use-focus-trap';
export { useArrowNavigation } from './hooks/use-arrow-navigation';
export { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
export type { KeyboardShortcut } from './hooks/use-keyboard-shortcuts';

// --- Components ---
export { SkipLink } from './components/skip-link';
export { VisuallyHidden } from './components/visually-hidden';
export { LiveRegion } from './components/live-region';
export type { LiveRegionProps } from './components/live-region';
export { AccessibleField } from './components/accessible-field';
export type { AccessibleFieldProps } from './components/accessible-field';
export { AccessibleButton } from './components/accessible-button';
export type { AccessibleButtonProps } from './components/accessible-button';
export { RouteAnnouncer } from './components/route-announcer';

// --- Testing ---
export {
  checkA11y,
  formatViolations,
  initAxeDevTools,
  AXE_WCAG_TAGS,
  AXE_DEFAULT_OPTIONS,
  AXE_STRICT_OPTIONS,
} from './testing/axe-config';
