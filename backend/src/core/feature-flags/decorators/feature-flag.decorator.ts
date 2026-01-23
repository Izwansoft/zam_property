import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAGS_KEY = 'feature_flags';

/**
 * Require one or more feature flags to be enabled for a route.
 * Used with FeatureFlagGuard.
 */
export const FeatureFlag = (...flagKeys: string[]) => SetMetadata(FEATURE_FLAGS_KEY, flagKeys);
