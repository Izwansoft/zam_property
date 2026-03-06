import { create } from 'zustand';

import type { ModuleKey } from '../modules/registry/types';

type ModuleState = {
  selectedModule: ModuleKey | null;
  setSelectedModule: (moduleKey: ModuleKey) => void;
  clearSelectedModule: () => void;
};

export const useModuleStore = create<ModuleState>((set) => ({
  selectedModule: null,
  setSelectedModule: (moduleKey) => {
    set({ selectedModule: moduleKey });
  },
  clearSelectedModule: () => {
    set({ selectedModule: null });
  },
}));
