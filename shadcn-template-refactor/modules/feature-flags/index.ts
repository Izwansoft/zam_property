// =============================================================================
// Feature Flags Module — Barrel Export
// =============================================================================
// Session 4.5: Feature Flags & Experiments UI
// =============================================================================

// Types
export type {
  FeatureFlag,
  FeatureFlagType,
  FeatureFlagOverride,
  FeatureFlagUserTarget,
  FeatureFlagDetail,
  Experiment,
  ExperimentVariant,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  AddFlagOverrideDto,
  AddFlagUserTargetDto,
  CreateExperimentDto,
  PartnerOptInDto,
  FeatureFlagCheckResult,
} from "./types";

export { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS, formatFlagKey } from "./types";

// Hooks — Feature Flags
export { useFeatureFlags } from "./hooks/use-feature-flags";
export { useFeatureFlagDetail } from "./hooks/use-feature-flag-detail";
export { useCreateFeatureFlag } from "./hooks/use-create-feature-flag";
export { useUpdateFeatureFlag } from "./hooks/use-update-feature-flag";
export { useAddFlagOverride } from "./hooks/use-add-flag-override";
export { useAddFlagUserTarget } from "./hooks/use-add-flag-user-target";
export { useCheckFeatureFlag } from "./hooks/use-check-feature-flag";

// Hooks — Experiments
export { useExperiments } from "./hooks/use-experiments";
export { useExperimentDetail } from "./hooks/use-experiment-detail";
export { useCreateExperiment } from "./hooks/use-create-experiment";
export { useOptInPartnerExperiment } from "./hooks/use-opt-in-partner-experiment";

// Components
export { FeatureGate } from "./components/feature-gate";
export { FeatureFlagList } from "./components/feature-flag-list";
export { FeatureFlagCreateDialog } from "./components/feature-flag-create-dialog";
export { FeatureFlagDetailView } from "./components/feature-flag-detail-view";
export { ExperimentsList } from "./components/experiments-list";
export { ExperimentCreateDialog } from "./components/experiment-create-dialog";
export { ExperimentDetailView } from "./components/experiment-detail-view";
