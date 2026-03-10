// verticals/attribute-renderer/dynamic-form.tsx — DynamicForm with groups & collapsible sections

"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AttributeSchema, AttributeGroup } from "../types";
import { groupAttributes } from "../registry/mappers";
import { AttributeRenderer } from "./renderer";

interface DynamicFormProps {
  /** The attribute schema to render */
  schema: AttributeSchema;
  /** Base path in the form (e.g. "attributes") */
  basePath?: string;
  /** Whether all fields are disabled */
  disabled?: boolean;
  /** Specific groups to render (omit to render all) */
  groups?: string[];
  /** Grid columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * DynamicForm — Renders an entire attribute schema as grouped,
 * collapsible form sections.
 *
 * Uses the AttributeRenderer for each field and groups them
 * according to the schema's group definitions.
 */
export function DynamicForm({
  schema,
  basePath = "attributes",
  disabled,
  groups: filterGroups,
  columns = 2,
}: DynamicFormProps) {
  const grouped = useMemo(() => groupAttributes(schema), [schema]);

  // Filter to specific groups if requested
  const visibleGroups = useMemo(() => {
    if (!filterGroups) return Array.from(grouped.entries());
    return Array.from(grouped.entries()).filter(([group]) =>
      filterGroups.includes(group.key)
    );
  }, [grouped, filterGroups]);

  if (visibleGroups.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No attributes defined for this vertical.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleGroups.map(([group, attrs]) => (
        <DynamicFormGroup
          key={group.key}
          group={group}
          attributes={attrs}
          basePath={basePath}
          disabled={disabled}
          columns={columns}
        />
      ))}
    </div>
  );
}

// --- Group Section ---

interface DynamicFormGroupProps {
  group: AttributeGroup;
  attributes: import("../types").AttributeDefinition[];
  basePath: string;
  disabled?: boolean;
  columns: 1 | 2 | 3 | 4;
}

function DynamicFormGroup({
  group,
  attributes,
  basePath,
  disabled,
  columns,
}: DynamicFormGroupProps) {
  const [isOpen, setIsOpen] = useState(!group.defaultCollapsed);

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const content = (
    <div className={`grid ${gridCols} gap-4`}>
      {attributes.map((attr) => {
        // Handle colSpan
        const spanClass =
          attr.ui.colSpan && attr.ui.colSpan > 1
            ? `col-span-1 md:col-span-${Math.min(attr.ui.colSpan, columns)}`
            : "";

        return (
          <div key={attr.key} className={spanClass}>
            <AttributeRenderer
              attribute={attr}
              basePath={basePath}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );

  // Non-collapsible group
  if (!group.collapsible) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{group.label}</h3>
          {group.description && (
            <p className="text-muted-foreground text-sm">
              {group.description}
            </p>
          )}
        </div>
        {content}
      </div>
    );
  }

  // Collapsible group
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
          >
            <div className="text-left">
              <h3 className="text-lg font-semibold">{group.label}</h3>
              {group.description && (
                <p className="text-muted-foreground text-sm font-normal">
                  {group.description}
                </p>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>{content}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}
