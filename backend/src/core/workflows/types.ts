/**
 * State Machine Types and Interfaces
 *
 * Type-safe state machine infrastructure for managing entity lifecycle workflows.
 */

/**
 * Represents a state transition configuration
 */
export interface StateTransition<TState extends string, TEvent extends string> {
  from: TState | TState[];
  to: TState;
  event: TEvent;
  guards?: TransitionGuard<TState>[];
  before?: TransitionHook<TState>;
  after?: TransitionHook<TState>;
}

/**
 * Guard function that validates if a transition is allowed
 */
export type TransitionGuard<TState extends string> = (context: {
  currentState: TState;
  data?: Record<string, unknown>;
}) => boolean | Promise<boolean>;

/**
 * Hook function executed before or after a transition
 */
export type TransitionHook<TState extends string> = (context: {
  fromState: TState;
  toState: TState;
  data?: Record<string, unknown>;
}) => void | Promise<void>;

/**
 * Configuration for a state in the state machine
 */
export interface StateConfig<TState extends string> {
  name: TState;
  onEnter?: (data?: Record<string, unknown>) => void | Promise<void>;
  onExit?: (data?: Record<string, unknown>) => void | Promise<void>;
}

/**
 * Transition result
 */
export interface TransitionResult<TState extends string> {
  success: boolean;
  fromState: TState;
  toState: TState;
  error?: string;
}

/**
 * Metadata for @Transition decorator
 */
export interface TransitionMetadata {
  from: string | string[];
  to: string;
  event?: string;
}
