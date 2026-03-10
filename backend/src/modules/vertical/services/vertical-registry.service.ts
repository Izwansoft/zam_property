/**
 * Vertical Registry Service
 *
 * Tracks which vertical modules are implemented and loaded in the backend.
 * Each vertical module registers itself on initialization via onModuleInit.
 *
 * This provides runtime detection of vertical availability - the frontend
 * can query the /verticals/health endpoint to know which verticals are
 * actually coded and ready vs. just planned.
 */
import { Injectable, Logger } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerticalImplementationStatus = 'READY' | 'BETA' | 'EXPERIMENTAL';

export interface VerticalRegistryEntry {
  /** Vertical type key (e.g., 'real_estate', 'automotive') */
  type: string;

  /** Human-readable name */
  name: string;

  /** Module version */
  version: string;

  /** Implementation status */
  status: VerticalImplementationStatus;

  /** Timestamp when the module registered */
  registeredAt: Date;

  /** Optional features supported by this vertical */
  features?: string[];
}

export interface VerticalHealthResponse {
  /** Map of vertical type -> registry entry */
  verticals: Record<string, VerticalRegistryEntry>;

  /** Total number of implemented verticals */
  implementedCount: number;

  /** List of implemented vertical types */
  implementedTypes: string[];

  /** Server timestamp */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Registry Service
// ---------------------------------------------------------------------------

@Injectable()
export class VerticalRegistryService {
  private readonly logger = new Logger(VerticalRegistryService.name);
  private readonly registry = new Map<string, VerticalRegistryEntry>();

  /**
   * Register a vertical module as implemented.
   * Called by each vertical module in its onModuleInit lifecycle hook.
   */
  register(entry: Omit<VerticalRegistryEntry, 'registeredAt'>): void {
    if (this.registry.has(entry.type)) {
      this.logger.warn(`Vertical '${entry.type}' already registered, updating...`);
    }

    const fullEntry: VerticalRegistryEntry = {
      ...entry,
      registeredAt: new Date(),
    };

    this.registry.set(entry.type, fullEntry);
    this.logger.log(
      `Registered vertical: ${entry.type} (${entry.name}) v${entry.version} [${entry.status}]`,
    );
  }

  /**
   * Check if a vertical is implemented (module is loaded).
   */
  isImplemented(type: string): boolean {
    return this.registry.has(type.toLowerCase());
  }

  /**
   * Get a specific vertical's registry entry.
   */
  get(type: string): VerticalRegistryEntry | undefined {
    return this.registry.get(type.toLowerCase());
  }

  /**
   * Get all registered verticals.
   */
  getAll(): VerticalRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get the health response for the /verticals/health endpoint.
   */
  getHealthResponse(): VerticalHealthResponse {
    const verticals: Record<string, VerticalRegistryEntry> = {};
    const implementedTypes: string[] = [];

    for (const [type, entry] of this.registry) {
      verticals[type] = entry;
      implementedTypes.push(type);
    }

    return {
      verticals,
      implementedCount: this.registry.size,
      implementedTypes,
      timestamp: new Date().toISOString(),
    };
  }
}
