import type { PluginManifest } from "./PluginManifest.js";
import type { PluginContext } from "./PluginContext.js";

/**
 * A plugin is a class instance with a stable manifest and one activation
 * method. Activation may only register extensions; it receives no host
 * assembly objects and cannot reach the loader.
 */
export interface Plugin {
  readonly manifest: PluginManifest;
  configure?(options: Readonly<Record<string, unknown>>): void;
  activate(context: PluginContext): void;
}
