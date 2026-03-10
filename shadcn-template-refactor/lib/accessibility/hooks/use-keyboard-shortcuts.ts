/**
 * useKeyboardShortcuts Hook
 *
 * Registers global or scoped keyboard shortcuts with modifier key support.
 * Automatically ignores shortcuts when typing in form fields.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'k', modifiers: ['ctrl'], handler: () => openSearch(), description: 'Open search' },
 *   { key: 'Escape', handler: () => closeModal(), description: 'Close modal' },
 * ]);
 * ```
 *
 * @see WCAG 2.1.4 — Character Key Shortcuts
 */
'use client';

import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  /** The key to listen for (e.g. 'k', 'Escape', 'Enter') */
  key: string;
  /** Required modifier keys */
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  /** Handler called when the shortcut is activated */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable description of what the shortcut does */
  description?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether the shortcut is currently enabled */
  enabled?: boolean;
}

/** Elements where keyboard shortcuts should be suppressed */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return INPUT_TAGS.has(target.tagName) || target.isContentEditable;
}

/**
 * Registers keyboard shortcuts on the document.
 * Shortcuts are automatically disabled when focus is in a form input field.
 *
 * @param shortcuts - Array of keyboard shortcut definitions
 * @param scope - Optional ref to scope shortcuts to a specific container
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  scope?: React.RefObject<HTMLElement | null>,
): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in form fields (unless modifier keys are used)
      if (isInputElement(e.target)) {
        const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
        if (!hasModifier) return;
      }

      // If scoped, check that the event target is within scope
      if (scope?.current && !scope.current.contains(e.target as Node)) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

        const modifiers = shortcut.modifiers ?? [];
        const ctrlRequired = modifiers.includes('ctrl');
        const altRequired = modifiers.includes('alt');
        const shiftRequired = modifiers.includes('shift');
        const metaRequired = modifiers.includes('meta');

        // Match: required modifiers must be pressed, non-required must NOT be (except for combos)
        if (ctrlRequired !== (e.ctrlKey || e.metaKey)) continue;
        if (altRequired !== e.altKey) continue;
        if (shiftRequired !== e.shiftKey) continue;
        if (metaRequired !== e.metaKey && !ctrlRequired) continue;

        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }

        shortcut.handler(e);
        break; // Only trigger the first matching shortcut
      }
    };

    const target = scope?.current ?? document;
    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => target.removeEventListener('keydown', handleKeyDown as EventListener);
  }, [scope]);
}
