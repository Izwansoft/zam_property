import type { ReactElement } from 'react';

import { AutomotiveHomeScreen } from '../automotive/screens/AutomotiveHomeScreen';
import { ElectronicsHomeScreen } from '../electronics/screens/ElectronicsHomeScreen';
import { RealEstateModuleShell } from '../real-estate/navigation/RealEstateModuleShell';

import type { ModuleKey, ModuleMeta } from './types';

type ModuleRegistryEntry = {
  meta: ModuleMeta;
  Shell: () => ReactElement;
};

export const moduleRegistry: Record<ModuleKey, ModuleRegistryEntry> = {
  'real-estate': {
    meta: {
      key: 'real-estate',
      title: 'Real Estate',
      description: 'Property rental, sale listings, and real-estate workflows.',
    },
    Shell: RealEstateModuleShell,
  },
  automotive: {
    meta: {
      key: 'automotive',
      title: 'Automotive',
      description: 'Vehicle marketplace and automotive module experience.',
    },
    Shell: AutomotiveHomeScreen,
  },
  electronics: {
    meta: {
      key: 'electronics',
      title: 'Electronics',
      description: 'Consumer electronics listings and buying experience.',
    },
    Shell: ElectronicsHomeScreen,
  },
};
