import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PluginRuntime } from "../../kernel/plugin/PluginRuntime.js";
import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginConfigEntry } from "./PluginConfig.js";

interface PackageMetadata {
  readonly name?: string;
  readonly contributes?: PluginManifest["contributes"];
}

/**
 * Config assembly. It only understands module specifiers and package metadata:
 * there is no plugin-name switch or hard-coded import anywhere in this file.
 */
export class PluginConfigLoader {
  public constructor(private readonly runtime: PluginRuntime) {}

  /** Loads every enabled entry in order and returns recoverable error lines. */
  public async load(configPath: string): Promise<readonly string[]> {
    const entries = this.readConfig(configPath);
    if (entries === null) {
      return ["invalid plugin config"];
    }
    const errors: string[] = [];
    const baseDirectory = dirname(resolve(configPath));
    for (const entry of entries) {
      const message = await this.loadEntry(entry, baseDirectory);
      if (message !== null) {
        errors.push(message);
      }
    }
    return errors;
  }

  private readConfig(configPath: string): readonly PluginConfigEntry[] | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(configPath, "utf8"));
    } catch {
      return null;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    const plugins = (parsed as { plugins?: unknown }).plugins;
    if (!Array.isArray(plugins)) {
      return null;
    }
    const entries: PluginConfigEntry[] = [];
    for (const candidate of plugins) {
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
        return null;
      }
      const record = candidate as Record<string, unknown>;
      if (typeof record.module !== "string" || record.module.length === 0) {
        return null;
      }
      if (record.enabled !== undefined && typeof record.enabled !== "boolean") {
        return null;
      }
      if (
        record.options !== undefined &&
        (typeof record.options !== "object" || record.options === null || Array.isArray(record.options))
      ) {
        return null;
      }
      entries.push({
        module: record.module,
        enabled: record.enabled as boolean | undefined,
        options: record.options as Readonly<Record<string, unknown>> | undefined
      });
    }
    return entries;
  }

  private async loadEntry(
    entry: PluginConfigEntry,
    baseDirectory: string
  ): Promise<string | null> {
    if (entry.enabled === false) {
      return null;
    }

    let resolved: string;
    try {
      const requireFromConfig = createRequire(join(baseDirectory, "__plugin_config__.js"));
      resolved = requireFromConfig.resolve(entry.module);
    } catch {
      return `plugin not found: ${entry.module}`;
    }

    let imported: { default?: unknown };
    try {
      imported = (await import(pathToFileURL(resolved).href)) as { default?: unknown };
    } catch (error) {
      return `plugin failed to activate: ${entry.module} (${this.reason(error)})`;
    }
    const plugin = imported.default;
    if (plugin === undefined) {
      return `plugin has no default export: ${entry.module}`;
    }
    if (!this.isPlugin(plugin)) {
      return `plugin failed to activate: ${entry.module} (default export is not a plugin)`;
    }

    const metadata = this.findPackageMetadata(resolved);
    const manifest: PluginManifest = {
      name: metadata?.name ?? plugin.manifest.name,
      contributes: metadata?.contributes ?? plugin.manifest.contributes
    };
    try {
      this.runtime.activate(plugin, entry.options, manifest);
      return null;
    } catch (error) {
      return this.reason(error);
    }
  }

  private isPlugin(value: unknown): value is Plugin {
    return (
      typeof value === "object" &&
      value !== null &&
      "manifest" in value &&
      typeof (value as { activate?: unknown }).activate === "function"
    );
  }

  private findPackageMetadata(modulePath: string): PackageMetadata | null {
    let directory = dirname(modulePath);
    while (true) {
      const candidate = join(directory, "package.json");
      if (existsSync(candidate)) {
        try {
          const parsed = JSON.parse(readFileSync(candidate, "utf8")) as Record<string, unknown>;
          if (typeof parsed.name === "string" || parsed.contributes !== undefined) {
            return {
              name: typeof parsed.name === "string" ? parsed.name : undefined,
              contributes: parsed.contributes as PluginManifest["contributes"]
            };
          }
        } catch {
          return null;
        }
      }
      const parent = dirname(directory);
      if (parent === directory) {
        return null;
      }
      directory = parent;
    }
  }

  private reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** Used only by tests to prove relative resolution is config-dir based. */
  public static resolveFrom(baseDirectory: string, specifier: string): string {
    return createRequire(join(baseDirectory, "__plugin_config__.js")).resolve(specifier);
  }

  public static absolute(path: string, base: string): string {
    return isAbsolute(path) ? path : resolve(base, path);
  }
}
