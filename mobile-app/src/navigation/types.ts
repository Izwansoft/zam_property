import type { ModuleKey } from '../modules/registry/types';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ModuleSelector: undefined;
  ModuleHost: {
    moduleKey?: ModuleKey;
  } | undefined;
};
