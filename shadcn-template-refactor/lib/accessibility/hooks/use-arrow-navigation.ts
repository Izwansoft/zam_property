/**
 * useArrowNavigation Hook
 *
 * Enables arrow key navigation within a container of items.
 * Follows WAI-ARIA composite widget patterns (menu, listbox, tabs, grid).
 *
 * @example
 * ```tsx
 * const { activeIndex, containerProps, getItemProps } = useArrowNavigation({
 *   itemCount: items.length,
 *   orientation: 'vertical',
 *   onSelect: (index) => handleSelect(items[index]),
 * });
 *
 * return (
 *   <ul role="listbox" {...containerProps}>
 *     {items.map((item, i) => (
 *       <li key={item.id} role="option" {...getItemProps(i)}>
 *         {item.label}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 *
 * @see WAI-ARIA Listbox Pattern
 * @see WCAG 2.1.1 — Keyboard
 */
'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';

export interface ArrowNavigationOptions {
  /** Total number of navigable items */
  itemCount: number;
  /** Navigation direction */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Whether navigation wraps around */
  loop?: boolean;
  /** Initial active index */
  initialIndex?: number;
  /** Callback when an item is selected (Enter/Space) */
  onSelect?: (index: number) => void;
  /** Callback when active index changes */
  onChange?: (index: number) => void;
}

interface ArrowNavigationReturn {
  /** Currently active (focused) item index */
  activeIndex: number;
  /** Set active index programmatically */
  setActiveIndex: (index: number) => void;
  /** Props to spread on the container element */
  containerProps: {
    role: string;
    onKeyDown: (e: KeyboardEvent) => void;
  };
  /** Get props for each navigable item */
  getItemProps: (index: number) => {
    tabIndex: number;
    'data-active': boolean;
    'aria-selected': boolean;
    onFocus: () => void;
  };
}

/**
 * Manages arrow key navigation within a container.
 * Supports horizontal, vertical, or both orientations with optional wrapping.
 */
export function useArrowNavigation(options: ArrowNavigationOptions): ArrowNavigationReturn {
  const {
    itemCount,
    orientation = 'vertical',
    loop = true,
    initialIndex = 0,
    onSelect,
    onChange,
  } = options;

  const [activeIndex, setActiveIndexState] = useState(initialIndex);

  const setActiveIndex = useCallback((index: number) => {
    setActiveIndexState(index);
    onChange?.(index);
  }, [onChange]);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    setActiveIndexState(prev => {
      let next: number;
      if (direction === 'next') {
        next = prev + 1;
        if (next >= itemCount) {
          next = loop ? 0 : itemCount - 1;
        }
      } else {
        next = prev - 1;
        if (next < 0) {
          next = loop ? itemCount - 1 : 0;
        }
      }
      onChange?.(next);
      return next;
    });
  }, [itemCount, loop, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    switch (e.key) {
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          navigate('next');
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          navigate('prev');
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          navigate('next');
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          navigate('prev');
        }
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(activeIndex);
        break;
    }
  }, [orientation, navigate, itemCount, activeIndex, onSelect, setActiveIndex]);

  const containerProps = {
    role: 'listbox' as const,
    onKeyDown: handleKeyDown,
  };

  const getItemProps = useCallback((index: number) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    'data-active': index === activeIndex,
    'aria-selected': index === activeIndex,
    onFocus: () => setActiveIndex(index),
  }), [activeIndex, setActiveIndex]);

  return {
    activeIndex,
    setActiveIndex,
    containerProps,
    getItemProps,
  };
}
