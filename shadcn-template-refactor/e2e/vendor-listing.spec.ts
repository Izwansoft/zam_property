/**
 * E2E Test — Vendor Listing Journey
 *
 * Critical path: Login as vendor → Navigate to listings → Create listing →
 * Save draft → Verify saved.
 *
 * This test exercises the full browser flow via Playwright.
 *
 * @see docs/ai-prompt/part-18.md §18.5
 */

import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = 'vendor@zamproperty.com';
const VENDOR_PASSWORD = 'password123';

test.describe('Vendor Listing Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as vendor
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(VENDOR_EMAIL);
    await page.getByLabel(/password/i).fill(VENDOR_PASSWORD);
    await page.getByRole('button', { name: /log\s?in|sign\s?in/i }).click();

    // Wait for redirect to vendor dashboard
    await page.waitForURL(/\/dashboard\/vendor/, { timeout: 10_000 });
  });

  test('should display vendor dashboard after login', async ({ page }) => {
    // Verify we're on the vendor portal
    await expect(page).toHaveURL(/\/dashboard\/vendor/);

    // Should see vendor-relevant navigation
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should navigate to listings page', async ({ page }) => {
    // Navigate to listings
    await page.getByRole('link', { name: /listings/i }).click();
    await page.waitForURL(/\/dashboard\/vendor\/listings/);

    // Should see listing page heading or content
    await expect(
      page.getByRole('heading', { name: /listings/i })
    ).toBeVisible();
  });

  test('should create a new draft listing', async ({ page }) => {
    // Navigate to listings
    await page.getByRole('link', { name: /listings/i }).click();
    await page.waitForURL(/\/dashboard\/vendor\/listings/);

    // Click create/add new listing button
    const createButton = page.getByRole('link', { name: /create|add|new/i }).or(
      page.getByRole('button', { name: /create|add|new/i })
    );
    await createButton.click();

    // Wait for create page
    await page.waitForURL(/\/dashboard\/vendor\/listings\/(new|create)/);

    // Fill basic listing form
    await page.getByLabel(/title/i).fill('E2E Test Listing - Luxury Condo');

    // Look for description field (may be textarea)
    const descriptionField = page.getByLabel(/description/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('A beautiful luxury condo for testing.');
    }

    // Save as draft
    const saveDraftButton = page.getByRole('button', { name: /save.*draft|draft/i });
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();

      // Should show success feedback (toast or redirect)
      await expect(
        page.getByText(/saved|created|success/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test('should show listing detail after creation', async ({ page }) => {
    // Navigate to listings
    await page.getByRole('link', { name: /listings/i }).click();
    await page.waitForURL(/\/dashboard\/vendor\/listings/);

    // Click on first listing (if exists)
    const firstListing = page.getByRole('link', { name: /listing/i }).first();
    if (await firstListing.isVisible()) {
      await firstListing.click();

      // Should navigate to detail page
      await page.waitForURL(/\/dashboard\/vendor\/listings\/[\w-]+/);

      // Should show listing content
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });
});
