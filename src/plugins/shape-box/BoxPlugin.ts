import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { BoxAttributeHandler } from "./BoxAttributeHandler.js";
import { BoxShapeProvider } from "./BoxShapeProvider.js";
import { BoxTypeDecorator } from "./BoxTypeDecorator.js";

/**
 * Box is the end-to-end validation of all three shape-related extension
 * points: a ShapeProvider, an AttributeHandler and a TreeDecorator.
 */
export class BoxPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-shape-box",
    contributes: {
      shapes: ["box"],
      attributes: ["box-attributes"],
      decorators: ["box-type-label"]
    }
  };

  public activate(context: PluginContext): void {
    context.registerShape(new BoxShapeProvider());
    context.registerAttributeHandler(new BoxAttributeHandler());
    context.registerDecorator(new BoxTypeDecorator());
  }
}

export default new BoxPlugin();
