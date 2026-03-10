/**
 * useFocusTrap Hook
 *
 * Traps keyboard focus within a container element (e.g. modals, dialogs).
 * Tab and Shift+Tab cycle through focusable elements without leaving the container.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(containerRef, isOpen);
 *
 * return (
 *   <div ref={containerRef}>
 *     <input />
 *     <button>Close</button>
 *   </div>
 * );
 * ```
 *
 * @see WCAG 2.1.2 — No Keyboard Trap (focus trap is intentional for modals)
 * @see WAI-ARIA Dialog Pattern
 */
'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

/**
 * Traps focus within the referenced container when active.
 *
 * @param containerRef - Ref to the container element
 * @param active - Whether the trap is active (default: true)
 * @param autoFocus - Whether to auto-focus the first element (default: true)
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean = true,
  autoFocus: boolean = true,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !active) return;

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Auto-focus the first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          focusableElements[0].focus();
        });
      }
    }

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, active, autoFocus]);
}
