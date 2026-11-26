import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { CircleShapeProvider } from "./CircleShapeProvider.js";
import { EllipseShapeProvider } from "./EllipseShapeProvider.js";
import { GroupShapeProvider } from "./GroupShapeProvider.js";
import { LineShapeProvider } from "./LineShapeProvider.js";
import { RectShapeProvider } from "./RectShapeProvider.js";
import { TextShapeProvider } from "./TextShapeProvider.js";

/** Registers the six Phase 1 shapes through the same ShapeProvider path as box. */
export class BuiltinShapesPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-builtin-shapes",
    contributes: {
      shapes: ["rect", "circle", "ellipse", "line", "text", "g"]
    }
  };

  public activate(context: PluginContext): void {
    context.registerShape(new RectShapeProvider());
    context.registerShape(new CircleShapeProvider());
    context.registerShape(new EllipseShapeProvider());
    context.registerShape(new LineShapeProvider());
    context.registerShape(new TextShapeProvider());
    context.registerShape(new GroupShapeProvider());
  }
}

export default new BuiltinShapesPlugin();
