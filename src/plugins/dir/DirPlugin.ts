import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { DirCommand } from "./DirCommand.js";

export class DirPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-dir",
    contributes: { commands: ["dir"] }
  };

  public activate(context: PluginContext): void {
    context.registerCommand(new DirCommand());
  }
}

export default new DirPlugin();
