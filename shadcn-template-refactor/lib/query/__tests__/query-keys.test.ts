/**
 * Unit Tests — Query Key Factory
 *
 * Validates that query keys follow the expected patterns:
 * - Partner-scoped keys contain partnerId
 * - Platform-scoped keys are unscoped
 * - Each resource produces deterministic, unique keys
 *
 * @see lib/query/index.ts
 * @see docs/ai-prompt/part-18.md §18.3
 */

import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/lib/query';

describe('queryKeys', () => {
  // -----------------------------------------------------------------------
  // Auth (unscoped)
  // -----------------------------------------------------------------------
  describe('auth', () => {
    it('should have a stable root key', () => {
      expect(queryKeys.auth.all).toEqual(['auth']);
    });

    it('me() should extend root key', () => {
      expect(queryKeys.auth.me()).toEqual(['auth', 'me']);
    });

    it('session() should extend root key', () => {
      expect(queryKeys.auth.session()).toEqual(['auth', 'session']);
    });
  });

  // -----------------------------------------------------------------------
  // Partners (platform scope)
  // -----------------------------------------------------------------------
  describe('partners', () => {
    it('should have stable root key with platform scope', () => {
      expect(queryKeys.partners.all).toEqual(['platform', 'partners']);
    });

    it('list() should include params', () => {
      const params = { page: 1, status: 'ACTIVE' };
      expect(queryKeys.partners.list(params)).toEqual([
        'platform', 'partners', 'list', params,
      ]);
    });

    it('list() without params should include undefined', () => {
      expect(queryKeys.partners.list()).toEqual([
        'platform', 'partners', 'list', undefined,
      ]);
    });

    it('detail() should scope by partnerId', () => {
      expect(queryKeys.partners.detail('t-1')).toEqual([
        'platform', 'partners', 'detail', 't-1',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Listings (partner-scoped)
  // -----------------------------------------------------------------------
  describe('listings', () => {
    const partnerId = 'partner-abc';

    it('all() should scope by partnerId', () => {
      expect(queryKeys.listings.all(partnerId)).toEqual([
        'partner', partnerId, 'listings',
      ]);
    });

    it('list() should include partnerId and params', () => {
      const params = { page: 2, status: 'PUBLISHED' };
      expect(queryKeys.listings.list(partnerId, params)).toEqual([
        'partner', partnerId, 'listings', 'list', params,
      ]);
    });

    it('detail() should scope by partnerId and listingId', () => {
      expect(queryKeys.listings.detail(partnerId, 'listing-1')).toEqual([
        'partner', partnerId, 'listings', 'detail', 'listing-1',
      ]);
    });

    it('different partners should produce different keys', () => {
      const key1 = queryKeys.listings.all('partner-a');
      const key2 = queryKeys.listings.all('partner-b');
      expect(key1).not.toEqual(key2);
    });
  });

  // -----------------------------------------------------------------------
  // Vendors (partner-scoped)
  // -----------------------------------------------------------------------
  describe('vendors', () => {
    it('should scope by partnerId', () => {
      expect(queryKeys.vendors.all('t-1')).toEqual(['partner', 't-1', 'vendors']);
    });

    it('detail() should include vendorId', () => {
      expect(queryKeys.vendors.detail('t-1', 'v-1')).toEqual([
        'partner', 't-1', 'vendors', 'detail', 'v-1',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Interactions (partner-scoped)
  // -----------------------------------------------------------------------
  describe('interactions', () => {
    it('should scope by partnerId', () => {
      expect(queryKeys.interactions.all('t-1')).toEqual([
        'partner', 't-1', 'interactions',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Reviews (partner-scoped)
  // -----------------------------------------------------------------------
  describe('reviews', () => {
    it('should include stats with target under partner scope', () => {
      expect(queryKeys.reviews.stats('t-1', 'vendor', 'v-1')).toEqual([
        'partner', 't-1', 'reviews', 'stats', 'vendor', 'v-1',
      ]);
    });

    it('should include stats without target under partner scope', () => {
      expect(queryKeys.reviews.stats('t-1')).toEqual([
        'partner', 't-1', 'reviews', 'stats', undefined, undefined,
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Notifications (unscoped)
  // -----------------------------------------------------------------------
  describe('notifications', () => {
    it('should have a stable root key', () => {
      expect(queryKeys.notifications.all).toEqual(['notifications']);
    });

    it('unreadCount() should extend root', () => {
      expect(queryKeys.notifications.unreadCount()).toEqual([
        'notifications', 'unread-count',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Subscriptions (partner-scoped)
  // -----------------------------------------------------------------------
  describe('subscriptions', () => {
    it('current() should scope by partnerId', () => {
      expect(queryKeys.subscriptions.current('t-1')).toEqual([
        'partner', 't-1', 'subscriptions', 'current',
      ]);
    });

    it('plans() should be unscoped', () => {
      expect(queryKeys.subscriptions.plans()).toEqual(['plans', undefined]);
    });

    it('entitlements() should scope by partnerId', () => {
      expect(queryKeys.subscriptions.entitlements('t-1')).toEqual([
        'partner', 't-1', 'subscriptions', 'entitlements',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Audit Logs (unscoped)
  // -----------------------------------------------------------------------
  describe('audit', () => {
    it('byTarget() should include targetType and targetId', () => {
      expect(queryKeys.audit.byTarget('LISTING', 'l-1')).toEqual([
        'audit', 'target', 'LISTING', 'l-1', undefined,
      ]);
    });

    it('actionTypes() should extend root', () => {
      expect(queryKeys.audit.actionTypes()).toEqual(['audit', 'action-types']);
    });
  });

  // -----------------------------------------------------------------------
  // Verticals (unscoped)
  // -----------------------------------------------------------------------
  describe('verticals', () => {
    it('schema() should include vertical type', () => {
      expect(queryKeys.verticals.schema('REAL_ESTATE')).toEqual([
        'verticals', 'schema', 'REAL_ESTATE',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Search (unscoped)
  // -----------------------------------------------------------------------
  describe('search', () => {
    it('suggestions() should include query text', () => {
      expect(queryKeys.search.suggestions('condo')).toEqual([
        'search', 'suggestions', 'condo',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Feature Flags (unscoped)
  // -----------------------------------------------------------------------
  describe('featureFlags', () => {
    it('check() should include flag key', () => {
      expect(queryKeys.featureFlags.check('dark-mode')).toEqual([
        'feature-flags', 'check', 'dark-mode',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Companies (partner-scoped)
  // -----------------------------------------------------------------------
  describe('companies', () => {
    it('all() should scope by partnerId', () => {
      expect(queryKeys.companies.all('t-1')).toEqual([
        'partner', 't-1', 'companies',
      ]);
    });

    it('list() should include params', () => {
      const params = { type: 'AGENCY', page: 1 };
      expect(queryKeys.companies.list('t-1', params)).toEqual([
        'partner', 't-1', 'companies', 'list', params,
      ]);
    });

    it('list() without params should include undefined', () => {
      expect(queryKeys.companies.list('t-1')).toEqual([
        'partner', 't-1', 'companies', 'list', undefined,
      ]);
    });

    it('detail() should scope by companyId', () => {
      expect(queryKeys.companies.detail('t-1', 'c-1')).toEqual([
        'partner', 't-1', 'companies', 'detail', 'c-1',
      ]);
    });

    it('admins() should scope by companyId', () => {
      expect(queryKeys.companies.admins('t-1', 'c-1')).toEqual([
        'partner', 't-1', 'companies', 'admins', 'c-1',
      ]);
    });
  });
});
