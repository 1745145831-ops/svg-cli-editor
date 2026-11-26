import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { ModifiedStarDecorator } from "./ModifiedStarDecorator.js";

export class TreeStarPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-tree-star",
    contributes: { decorators: ["modified-star"] }
  };

  public activate(context: PluginContext): void {
    const decorator = new ModifiedStarDecorator();
    context.registerDecorator(decorator);
    context.subscribe(decorator);
  }
}

export default new TreeStarPlugin();
