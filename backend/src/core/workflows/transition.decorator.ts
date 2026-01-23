import { TransitionMetadata } from './types';

const TRANSITION_METADATA_KEY = Symbol('transition');

/**
 * Decorator for marking state transition methods
 *
 * Usage:
 * ```typescript
 * @Transition('DRAFT', 'PUBLISHED')
 * async publish(listing: Listing) {
 *   // Implementation
 * }
 * ```
 *
 * @param from - Starting state(s) for this transition
 * @param to - Target state for this transition
 * @param event - Optional event name (defaults to method name)
 */
export function Transition(from: string | string[], to: string, event?: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const metadata: TransitionMetadata = {
      from,
      to,
      event: event ?? String(propertyKey),
    };

    // Store metadata on the method
    Reflect.defineMetadata(TRANSITION_METADATA_KEY, metadata, descriptor.value);

    return descriptor;
  };
}

/**
 * Get transition metadata from a method
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function getTransitionMetadata(method: Function): TransitionMetadata | undefined {
  return Reflect.getMetadata(TRANSITION_METADATA_KEY, method);
}
