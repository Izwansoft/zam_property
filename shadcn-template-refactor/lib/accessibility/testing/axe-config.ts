/**
 * axe-core Configuration & Testing Utilities
 *
 * Provides helpers for running accessibility audits in development
 * and in automated tests.
 *
 * Usage in tests:
 * ```ts
 * import { checkA11y, AXE_RULES } from '@/lib/accessibility/testing/axe-config';
 *
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await checkA11y(container);
 *   expect(results.violations).toHaveLength(0);
 * });
 * ```
 *
 * Usage in dev (React component):
 * ```ts
 * import { initAxeDevTools } from '@/lib/accessibility/testing/axe-config';
 * // Call once in your root component (development only)
 * initAxeDevTools();
 * ```
 *
 * @see WCAG 2.1 AA — https://www.w3.org/WAI/WCAG21/quickref/?currLevel=aa
 * @see axe-core rules — https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
 */

import type { AxeResults, RunOptions, Spec } from 'axe-core';

// ---------------------------------------------------------------------------
// WCAG 2.1 AA Rule Tags
// ---------------------------------------------------------------------------

/**
 * axe-core rule tags for WCAG 2.1 AA compliance (our target level).
 */
export const AXE_WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'best-practice',
] as const;

// ---------------------------------------------------------------------------
// Default axe-core Run Options
// ---------------------------------------------------------------------------

/**
 * Default axe-core run options targeting WCAG 2.1 AA.
 */
export const AXE_DEFAULT_OPTIONS: RunOptions = {
  runOnly: {
    type: 'tag',
    values: [...AXE_WCAG_TAGS],
  },
  resultTypes: ['violations', 'incomplete'],
};

/**
 * Strict axe-core run options — includes all rules, not just WCAG tags.
 */
export const AXE_STRICT_OPTIONS: RunOptions = {
  resultTypes: ['violations', 'incomplete'],
};

// ---------------------------------------------------------------------------
// axe-core Spec (rule customization)
// ---------------------------------------------------------------------------

/**
 * Custom axe-core spec to disable rules that produce false positives
 * in our stack (e.g., color-contrast on dynamically themed elements).
 */
export const AXE_CUSTOM_SPEC: Spec = {
  rules: [
    {
      // color-contrast can false-positive on CSS custom properties
      id: 'color-contrast',
      enabled: true,
    },
    {
      // Heading order is enforced by our page templates
      id: 'heading-order',
      enabled: true,
    },
    {
      // Region landmark — we handle this with skip links + main
      id: 'region',
      enabled: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Check Function
// ---------------------------------------------------------------------------

/**
 * Run axe-core accessibility audit on a DOM element.
 *
 * @param container - The DOM element to audit (defaults to document.body)
 * @param options   - axe-core run options (defaults to WCAG 2.1 AA)
 * @returns Promise<AxeResults> — violations, passes, incomplete, inapplicable
 *
 * @example
 * ```ts
 * const results = await checkA11y(document.getElementById('app'));
 * if (results.violations.length > 0) {
 *   console.error('Accessibility violations:', results.violations);
 * }
 * ```
 */
export async function checkA11y(
  container?: Element | null,
  options?: RunOptions
): Promise<AxeResults> {
  const axe = await import('axe-core');

  // Configure custom spec
  axe.default.configure(AXE_CUSTOM_SPEC);

  const target = container ?? document.body;
  const runOptions = options ?? AXE_DEFAULT_OPTIONS;

  return axe.default.run(target as Element, runOptions);
}

// ---------------------------------------------------------------------------
// Violation Formatter
// ---------------------------------------------------------------------------

/**
 * Format axe violations into readable console output.
 */
export function formatViolations(results: AxeResults): string {
  if (results.violations.length === 0) {
    return '✓ No accessibility violations found';
  }

  const lines: string[] = [
    `✗ ${results.violations.length} accessibility violation(s) found:\n`,
  ];

  for (const violation of results.violations) {
    lines.push(`  [${violation.impact?.toUpperCase()}] ${violation.id}`);
    lines.push(`  ${violation.description}`);
    lines.push(`  Help: ${violation.helpUrl}`);
    lines.push(`  Affected nodes:`);

    for (const node of violation.nodes) {
      lines.push(`    - ${node.html}`);
      if (node.failureSummary) {
        lines.push(`      ${node.failureSummary}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Dev Tools Integration
// ---------------------------------------------------------------------------

let axeDevInitialized = false;

/**
 * Initialize @axe-core/react for development-time accessibility auditing.
 * Logs violations to the browser console.
 *
 * Only runs in development mode and in the browser.
 * Safe to call multiple times — will only initialize once.
 *
 * @param delayMs - Delay before running first audit (default: 1000ms)
 */
export async function initAxeDevTools(delayMs = 1000): Promise<void> {
  if (axeDevInitialized) return;
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  axeDevInitialized = true;

  try {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const axeReact = await import('@axe-core/react');

    axeReact.default(React, ReactDOM, delayMs);
    // eslint-disable-next-line no-console
    console.log('[axe] Accessibility auditing enabled in development');
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[axe] Failed to initialize @axe-core/react');
  }
}
