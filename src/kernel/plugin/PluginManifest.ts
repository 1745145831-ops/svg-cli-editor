/**
 * Metadata declared by a plugin package. The canonical declaration lives in
 * the package's package.json (`contributes`); a runtime plugin object repeats
 * it so code assembly and config assembly can use one validation path.
 */
export interface PluginContributes {
  readonly shapes?: readonly string[];
  readonly commands?: readonly string[];
  readonly decorators?: readonly string[];
  readonly attributes?: readonly string[];
}

export interface PluginManifest {
  readonly name: string;
  readonly contributes?: PluginContributes;
}

export type ContributionCategory = "shapes" | "commands" | "decorators" | "attributes";

export interface ContributionNames {
  readonly shapes: readonly string[];
  readonly commands: readonly string[];
  readonly decorators: readonly string[];
  readonly attributes: readonly string[];
}

export const EMPTY_CONTRIBUTIONS: ContributionNames = {
  shapes: [],
  commands: [],
  decorators: [],
  attributes: []
};

export function normalizeContributions(
  contributes?: PluginContributes
): ContributionNames {
  return {
    shapes: [...(contributes?.shapes ?? [])].sort(),
    commands: [...(contributes?.commands ?? [])].sort(),
    decorators: [...(contributes?.decorators ?? [])].sort(),
    attributes: [...(contributes?.attributes ?? [])].sort()
  };
}

export function formatContributions(names: ContributionNames): string {
  return [
    `attributes=[${names.attributes.join(",")}]`,
    `commands=[${names.commands.join(",")}]`,
    `decorators=[${names.decorators.join(",")}]`,
    `shapes=[${names.shapes.join(",")}]`
  ].join(", ");
}

export function contributionsEqual(
  left: ContributionNames,
  right: ContributionNames
): boolean {
  return (["shapes", "commands", "decorators", "attributes"] as const).every(
    (category) =>
      left[category].length === right[category].length &&
      left[category].every((name, index) => name === right[category][index])
  );
}
