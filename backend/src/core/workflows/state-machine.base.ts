import { BadRequestException } from '@nestjs/common';

import { StateTransition, TransitionResult, StateConfig } from './types';

/**
 * Base State Machine class for managing entity lifecycle workflows
 *
 * Enforces:
 * - Explicit state transitions
 * - Transition validation via guards
 * - Event emission on state changes
 * - Side effects via hooks
 *
 * @template TState - Union type of possible states (e.g., ListingStatus)
 * @template TEvent - Union type of possible events (e.g., 'publish' | 'expire')
 */
export abstract class StateMachine<TState extends string, TEvent extends string> {
  protected transitions: Map<TEvent, StateTransition<TState, TEvent>> = new Map();
  protected states: Map<TState, StateConfig<TState>> = new Map();

  constructor() {
    this.defineTransitions();
    this.defineStates();
  }

  /**
   * Subclasses must implement this to define valid state transitions
   */
  protected abstract defineTransitions(): void;

  /**
   * Subclasses may override this to define state configurations
   */
  protected defineStates(): void {
    // Optional: Override in subclasses
  }

  /**
   * Register a state transition
   */
  protected registerTransition(transition: StateTransition<TState, TEvent>): void {
    this.transitions.set(transition.event, transition);
  }

  /**
   * Register a state configuration
   */
  protected registerState(state: StateConfig<TState>): void {
    this.states.set(state.name, state);
  }

  /**
   * Execute a state transition
   *
   * @param currentState - The current state of the entity
   * @param event - The event triggering the transition
   * @param data - Optional data for guards and hooks
   * @returns TransitionResult with success status and new state
   */
  async transition(
    currentState: TState,
    event: TEvent,
    data?: Record<string, unknown>,
  ): Promise<TransitionResult<TState>> {
    const transitionDef = this.transitions.get(event);

    if (!transitionDef) {
      return {
        success: false,
        fromState: currentState,
        toState: currentState,
        error: `Unknown event: ${event}`,
      };
    }

    // Check if current state is a valid starting state
    const validFromStates = Array.isArray(transitionDef.from)
      ? transitionDef.from
      : [transitionDef.from];

    if (!validFromStates.includes(currentState)) {
      return {
        success: false,
        fromState: currentState,
        toState: currentState,
        error: `Cannot transition from "${currentState}" to "${transitionDef.to}" via event "${event}". Valid starting states: ${validFromStates.join(', ')}`,
      };
    }

    // Execute guards
    if (transitionDef.guards && transitionDef.guards.length > 0) {
      for (const guard of transitionDef.guards) {
        const guardResult = await guard({ currentState, data });
        if (!guardResult) {
          return {
            success: false,
            fromState: currentState,
            toState: currentState,
            error: `Transition guard failed for event "${event}"`,
          };
        }
      }
    }

    // Execute onExit hook for current state
    const currentStateConfig = this.states.get(currentState);
    if (currentStateConfig?.onExit) {
      await currentStateConfig.onExit(data);
    }

    // Execute before hook
    if (transitionDef.before) {
      await transitionDef.before({
        fromState: currentState,
        toState: transitionDef.to,
        data,
      });
    }

    // Execute onEnter hook for new state
    const newStateConfig = this.states.get(transitionDef.to);
    if (newStateConfig?.onEnter) {
      await newStateConfig.onEnter(data);
    }

    // Execute after hook
    if (transitionDef.after) {
      await transitionDef.after({
        fromState: currentState,
        toState: transitionDef.to,
        data,
      });
    }

    return {
      success: true,
      fromState: currentState,
      toState: transitionDef.to,
    };
  }

  /**
   * Validate if a transition is possible without executing it
   */
  canTransition(currentState: TState, event: TEvent): boolean {
    const transitionDef = this.transitions.get(event);

    if (!transitionDef) {
      return false;
    }

    const validFromStates = Array.isArray(transitionDef.from)
      ? transitionDef.from
      : [transitionDef.from];

    return validFromStates.includes(currentState);
  }

  /**
   * Get the target state for an event from the current state
   */
  getTargetState(currentState: TState, event: TEvent): TState | null {
    const transitionDef = this.transitions.get(event);

    if (!transitionDef) {
      return null;
    }

    const validFromStates = Array.isArray(transitionDef.from)
      ? transitionDef.from
      : [transitionDef.from];

    if (!validFromStates.includes(currentState)) {
      return null;
    }

    return transitionDef.to;
  }

  /**
   * Throw exception if transition is not valid
   * Convenience method for services
   */
  protected assertCanTransition(currentState: TState, event: TEvent): void {
    if (!this.canTransition(currentState, event)) {
      const transitionDef = this.transitions.get(event);
      const validFromStates = transitionDef
        ? Array.isArray(transitionDef.from)
          ? transitionDef.from.join(', ')
          : transitionDef.from
        : 'unknown';

      throw new BadRequestException(
        `Cannot execute "${event}" from state "${currentState}". Valid starting states: ${validFromStates}`,
      );
    }
  }
}
