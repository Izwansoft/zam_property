/**
 * useAnnounce Hook
 *
 * Provides a function to make screen reader announcements via ARIA live regions.
 * Renders an invisible live region that announces messages to assistive technology.
 *
 * @example
 * ```tsx
 * const { announce, Announcer } = useAnnounce();
 *
 * const handleSave = () => {
 *   save();
 *   announce('Listing saved successfully');
 * };
 *
 * return (
 *   <>
 *     <Announcer />
 *     <button onClick={handleSave}>Save</button>
 *   </>
 * );
 * ```
 *
 * @see WCAG 4.1.3 — Status Messages
 */
'use client';

import React, { useState, useCallback, useRef, useId } from 'react';

interface AnnounceReturn {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  /** Render this component to enable announcements */
  Announcer: React.FC;
}

/**
 * Hook that provides screen reader announcement capabilities.
 * Returns an `announce` function and an `Announcer` component.
 * The Announcer must be rendered in the component tree.
 */
export function useAnnounce(): AnnounceReturn {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Clear first to force re-announcement of identical messages
    if (priority === 'assertive') {
      setAssertiveMessage('');
    } else {
      setPoliteMessage('');
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Small delay ensures the empty state registers before the new message
    timeoutRef.current = setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
    }, 100);
  }, []);

  const Announcer: React.FC = useCallback(() => {
    return React.createElement(React.Fragment, null,
      React.createElement('div', {
        id: `a11y-polite-${id}`,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        className: 'sr-only',
      }, politeMessage),
      React.createElement('div', {
        id: `a11y-assertive-${id}`,
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true',
        className: 'sr-only',
      }, assertiveMessage),
    );
  }, [id, politeMessage, assertiveMessage]);

  return { announce, Announcer };
}
