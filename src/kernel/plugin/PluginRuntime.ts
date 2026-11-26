import { DocumentEventBus } from "../ports/DocumentEventBus.js";
import { AttributeRegistry } from "./AttributeRegistry.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { PluginActivationContext } from "./PluginActivationContext.js";
import { PluginError } from "./PluginError.js";
import type { Plugin } from "./Plugin.js";
import {
  contributionsEqual,
  formatContributions,
  normalizeContributions,
  type ContributionNames,
  type PluginManifest
} from "./PluginManifest.js";
import { ShapeRegistry } from "./ShapeRegistry.js";
import { TreeDecoratorRegistry } from "./TreeDecoratorRegistry.js";

/**
 * Owns the four extension registries and the transactional activation path
 * shared by code assembly and config assembly.
 */
export class PluginRuntime {
  public readonly shapes = new ShapeRegistry();
  public readonly commands = new CommandRegistry();
  public readonly decorators = new TreeDecoratorRegistry();
  public readonly attributes = new AttributeRegistry();
  public readonly events = new DocumentEventBus();

  /**
   * Activates one plugin in a staging scope, validates its declared
   * contributions, then commits all registrations as one unit. Every failure
   * leaves the live registries untouched.
   */
  public activate(
    plugin: Plugin,
    options?: Readonly<Record<string, unknown>>,
    packageManifest?: PluginManifest
  ): ContributionNames {
    const manifest = packageManifest ?? plugin.manifest;
    const context = new PluginActivationContext();
    try {
      if (options !== undefined && plugin.configure !== undefined) {
        plugin.configure(options);
      }
      plugin.activate(context);
    } catch (error) {
      throw new PluginError(
        "activation-failed",
        `plugin failed to activate: ${manifest.name} (${this.reason(error)})`
      );
    }

    const actual = context.contributions();
    const declared = normalizeContributions(manifest.contributes);
    if (!contributionsEqual(declared, actual)) {
      throw new PluginError(
        "manifest-mismatch",
        `plugin manifest mismatch: ${manifest.name} ` +
          `(declared: ${formatContributions(declared)}; ` +
          `registered: ${formatContributions(actual)})`
      );
    }

    // Check every category before mutating any live registry. This makes the
    // multi-registry commit atomic with respect to duplicate registrations.
    for (const provider of context.shapeProviders) {
      this.shapes.assertAvailable(provider.shapeType);
    }
    for (const command of context.commands) {
      this.commands.assertAvailable(command);
    }
    for (const decorator of context.treeDecorators) {
      this.decorators.assertAvailable(decorator.name);
    }
    for (const handler of context.attributeHandlers) {
      this.attributes.assertAvailable(handler.name);
    }

    for (const provider of context.shapeProviders) {
      this.shapes.register(provider);
    }
    for (const command of context.commands) {
      this.commands.register(command);
    }
    for (const decorator of context.treeDecorators) {
      this.decorators.register(decorator);
    }
    for (const handler of context.attributeHandlers) {
      this.attributes.register(handler);
    }
    for (const subscriber of context.subscribers) {
      this.events.subscribe(subscriber);
    }
    return actual;
  }

  private reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

