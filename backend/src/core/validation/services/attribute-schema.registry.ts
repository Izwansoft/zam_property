/**
 * Attribute Schema Registry
 * Part 7 - Attribute Engine & Validation System
 *
 * In-memory registry for vertical attribute schemas and validation configs.
 * Schemas are registered at application startup and cached for fast access.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  IAttributeSchemaRegistry,
  RegisteredSchema,
  AttributeFieldValidationDef,
  VerticalValidationConfig,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface SchemaRegisteredEvent {
  verticalType: string;
  schemaVersion: string;
  fieldsCount: number;
  rulesCount: number;
  timestamp: Date;
}

export interface SchemaUpdatedEvent {
  verticalType: string;
  previousVersion: string;
  newVersion: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SCHEMA REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AttributeSchemaRegistry implements IAttributeSchemaRegistry, OnModuleInit {
  private readonly logger = new Logger(AttributeSchemaRegistry.name);

  /** Map of verticalType -> Map of schemaVersion -> RegisteredSchema */
  private readonly schemas = new Map<string, Map<string, RegisteredSchema>>();

  /** Map of verticalType -> latest schema version */
  private readonly latestVersions = new Map<string, string>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Attribute Schema Registry initialized');
    this.logger.log(`Registered verticals: ${this.getRegisteredVerticals().length}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a vertical's attribute schema
   */
  register(
    verticalType: string,
    schemaVersion: string,
    fields: AttributeFieldValidationDef[],
    validationConfig: VerticalValidationConfig,
  ): void {
    // Get or create version map for this vertical
    let versionMap = this.schemas.get(verticalType);
    if (!versionMap) {
      versionMap = new Map();
      this.schemas.set(verticalType, versionMap);
    }

    // Check if this version already exists
    const existing = versionMap.get(schemaVersion);
    if (existing) {
      this.logger.warn(
        `Schema version ${schemaVersion} for vertical ${verticalType} already exists, updating...`,
      );
    }

    // Create registered schema
    const registeredSchema: RegisteredSchema = {
      verticalType,
      schemaVersion,
      fields,
      validationConfig,
      registeredAt: new Date(),
    };

    // Store schema
    versionMap.set(schemaVersion, registeredSchema);

    // Update latest version (compare semantically if possible, else use latest registered)
    const currentLatest = this.latestVersions.get(verticalType);
    if (!currentLatest || this.isNewerVersion(schemaVersion, currentLatest)) {
      this.latestVersions.set(verticalType, schemaVersion);
    }

    this.logger.log(
      `Registered schema for vertical ${verticalType} v${schemaVersion} ` +
        `(${fields.length} fields, ${validationConfig.rules.length} rules)`,
    );

    // Emit event
    const event: SchemaRegisteredEvent = {
      verticalType,
      schemaVersion,
      fieldsCount: fields.length,
      rulesCount: validationConfig.rules.length,
      timestamp: new Date(),
    };
    this.eventEmitter.emit('schema.registered', event);
  }

  /**
   * Update a registered schema (for hot-reloading)
   */
  update(
    verticalType: string,
    schemaVersion: string,
    fields: AttributeFieldValidationDef[],
    validationConfig: VerticalValidationConfig,
  ): void {
    const versionMap = this.schemas.get(verticalType);
    if (!versionMap) {
      throw new Error(`Vertical ${verticalType} is not registered`);
    }

    const existing = versionMap.get(schemaVersion);
    if (!existing) {
      throw new Error(`Schema version ${schemaVersion} for vertical ${verticalType} not found`);
    }

    const previousVersion = existing.schemaVersion;

    // Update schema
    const updatedSchema: RegisteredSchema = {
      verticalType,
      schemaVersion,
      fields,
      validationConfig,
      registeredAt: new Date(),
    };

    versionMap.set(schemaVersion, updatedSchema);

    this.logger.log(`Updated schema for vertical ${verticalType} v${schemaVersion}`);

    // Emit event
    const event: SchemaUpdatedEvent = {
      verticalType,
      previousVersion,
      newVersion: schemaVersion,
      timestamp: new Date(),
    };
    this.eventEmitter.emit('schema.updated', event);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RETRIEVAL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get schema for a vertical (optionally by version)
   */
  getSchema(verticalType: string, schemaVersion?: string): RegisteredSchema | undefined {
    const versionMap = this.schemas.get(verticalType);
    if (!versionMap) {
      return undefined;
    }

    // If version specified, get that version
    if (schemaVersion) {
      return versionMap.get(schemaVersion);
    }

    // Otherwise get latest version
    const latestVersion = this.latestVersions.get(verticalType);
    if (!latestVersion) {
      return undefined;
    }

    return versionMap.get(latestVersion);
  }

  /**
   * Get latest schema version for a vertical
   */
  getLatestVersion(verticalType: string): string | undefined {
    return this.latestVersions.get(verticalType);
  }

  /**
   * Get all versions for a vertical
   */
  getVersions(verticalType: string): string[] {
    const versionMap = this.schemas.get(verticalType);
    if (!versionMap) {
      return [];
    }
    return Array.from(versionMap.keys()).sort();
  }

  /**
   * Check if vertical is registered
   */
  isRegistered(verticalType: string): boolean {
    return this.schemas.has(verticalType);
  }

  /**
   * Get all registered vertical types
   */
  getRegisteredVerticals(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get validation config for a vertical
   */
  getValidationConfig(
    verticalType: string,
    schemaVersion?: string,
  ): VerticalValidationConfig | undefined {
    const schema = this.getSchema(verticalType, schemaVersion);
    return schema?.validationConfig;
  }

  /**
   * Get fields for a vertical
   */
  getFields(
    verticalType: string,
    schemaVersion?: string,
  ): AttributeFieldValidationDef[] | undefined {
    const schema = this.getSchema(verticalType, schemaVersion);
    return schema?.fields;
  }

  /**
   * Get a specific field definition
   */
  getField(
    verticalType: string,
    fieldName: string,
    schemaVersion?: string,
  ): AttributeFieldValidationDef | undefined {
    const fields = this.getFields(verticalType, schemaVersion);
    if (!fields) {
      return undefined;
    }
    return fields.find((f) => f.name === fieldName);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get registry statistics
   */
  getStats(): {
    totalVerticals: number;
    totalSchemas: number;
    verticals: Array<{
      type: string;
      versions: string[];
      latestVersion: string;
      fieldsCount: number;
      rulesCount: number;
    }>;
  } {
    const verticals: Array<{
      type: string;
      versions: string[];
      latestVersion: string;
      fieldsCount: number;
      rulesCount: number;
    }> = [];

    let totalSchemas = 0;

    for (const [verticalType, versionMap] of this.schemas) {
      const versions = Array.from(versionMap.keys()).sort();
      const latestVersion = this.latestVersions.get(verticalType) ?? versions[versions.length - 1];
      const latestSchema = versionMap.get(latestVersion);

      totalSchemas += versions.length;

      verticals.push({
        type: verticalType,
        versions,
        latestVersion,
        fieldsCount: latestSchema?.fields.length ?? 0,
        rulesCount: latestSchema?.validationConfig.rules.length ?? 0,
      });
    }

    return {
      totalVerticals: this.schemas.size,
      totalSchemas,
      verticals,
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.schemas.clear();
    this.latestVersions.clear();
    this.logger.warn('Schema registry cleared');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compare two semantic versions
   */
  private isNewerVersion(version: string, current: string): boolean {
    const parseVersion = (v: string): number[] => {
      return v.split('.').map((n) => parseInt(n, 10) || 0);
    };

    const newParts = parseVersion(version);
    const currentParts = parseVersion(current);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] ?? 0;
      const currentPart = currentParts[i] ?? 0;

      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }

    return false; // Equal versions
  }
}
