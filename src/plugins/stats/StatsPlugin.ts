import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { StatsCommand } from "./StatsCommand.js";

export class StatsPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-stats",
    contributes: { commands: ["stats"] }
  };

  public activate(context: PluginContext): void {
    context.registerCommand(new StatsCommand());
  }
}

export default new StatsPlugin();
