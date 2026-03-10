// verticals/registry/cache.ts — VerticalRegistry singleton with local caching

import type {
  VerticalDefinition,
  AttributeSchema,
  VerticalSearchMapping,
  AttributeDefinition,
} from "../types";
import { fetchVerticals, fetchVerticalSchema } from "./api";

/**
 * VerticalRegistry — Singleton class that provides local caching
 * for vertical definitions and schemas.
 *
 * Use this for imperative access (outside React components).
 * Inside components, prefer the TanStack Query hooks from queries.ts.
 */
class VerticalRegistryClass {
  private definitions: Map<string, VerticalDefinition> = new Map();
  private schemas: Map<string, AttributeSchema> = new Map();
  private definitionsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Load all vertical definitions into cache.
   * Safe to call multiple times — deduplicates concurrent requests.
   */
  async loadDefinitions(): Promise<VerticalDefinition[]> {
    if (this.definitionsLoaded) {
      return Array.from(this.definitions.values());
    }

    if (!this.loadingPromise) {
      this.loadingPromise = fetchVerticals()
        .then((defs) => {
          for (const def of defs) {
            this.definitions.set(def.type, def);
          }
          this.definitionsLoaded = true;
        })
        .finally(() => {
          this.loadingPromise = null;
        });
    }

    await this.loadingPromise;
    return Array.from(this.definitions.values());
  }

  /**
   * Get a cached vertical definition by type.
   * Returns undefined if not loaded yet.
   */
  getDefinition(verticalType: string): VerticalDefinition | undefined {
    return this.definitions.get(verticalType);
  }

  /**
   * Get all cached vertical definitions.
   */
  getAllDefinitions(): VerticalDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Load and cache the attribute schema for a vertical.
   */
  async loadSchema(
    verticalType: string,
    version?: string
  ): Promise<AttributeSchema> {
    const key = this.schemaKey(verticalType, version);

    const cached = this.schemas.get(key);
    if (cached) return cached;

    const schema = await fetchVerticalSchema(verticalType, version);
    this.schemas.set(key, schema);
    return schema;
  }

  /**
   * Get a cached schema.
   */
  getSchema(
    verticalType: string,
    version?: string
  ): AttributeSchema | undefined {
    return this.schemas.get(this.schemaKey(verticalType, version));
  }

  /**
   * Get search mapping for a vertical type.
   */
  getSearchMapping(verticalType: string): VerticalSearchMapping | undefined {
    return this.definitions.get(verticalType)?.searchMapping;
  }

  /**
   * Get attribute definitions for a vertical, optionally filtered by group.
   */
  getAttributes(
    verticalType: string,
    version?: string,
    group?: string
  ): AttributeDefinition[] {
    const schema = this.getSchema(verticalType, version);
    if (!schema) return [];

    if (group) {
      return schema.attributes.filter((attr) => attr.ui.group === group);
    }
    return schema.attributes;
  }

  /**
   * Check if a vertical type is loaded.
   */
  isLoaded(verticalType: string): boolean {
    return this.definitions.has(verticalType);
  }

  /**
   * Invalidate all caches (e.g. after tenant vertical enablement change).
   */
  invalidate(): void {
    this.definitions.clear();
    this.schemas.clear();
    this.definitionsLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Invalidate a specific schema.
   */
  invalidateSchema(verticalType: string, version?: string): void {
    this.schemas.delete(this.schemaKey(verticalType, version));
  }

  private schemaKey(verticalType: string, version?: string): string {
    return version ? `${verticalType}:${version}` : verticalType;
  }
}

/** Singleton instance */
export const VerticalRegistry = new VerticalRegistryClass();
