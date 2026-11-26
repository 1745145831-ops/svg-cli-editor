import { RectShape } from "../../domain/model/RectShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import { TextShape } from "../../domain/model/TextShape.js";
import type {
  ShapeCreateRequest,
  ShapeProvider,
  SvgShapeRequest
} from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";
import { BoxShape } from "./BoxShape.js";

/** ShapeProvider for the composite box type (serialized as g + data-kind). */
export class BoxShapeProvider implements ShapeProvider {
  public readonly shapeType = "box";
  public readonly svgTags = ["g"] as const;
  public readonly isContainer = true;
  public readonly svgPriority = 10;
  public readonly helpUsage = 'box <id> <x> <y> <w> <h> "label"';
  public readonly fixedCliArgumentCount = 5;

  public matchesSvg(_tag: string, attributes: ReadonlyMap<string, string>): boolean {
    return attributes.get("data-kind") === "box";
  }

  public createFromCli(request: ShapeCreateRequest): Shape {
    const args = request.args;
    SvgProviderSupport.requireArgCount(
      "box",
      args,
      5,
      5,
      '<id> <x> <y> <width> <height> "<label>"'
    );
    return BoxShape.create(
      request.id,
      NumberFormat.parse(args[0] ?? "", "x"),
      NumberFormat.parse(args[1] ?? "", "y"),
      NumberFormat.parseNonNegative(args[2] ?? "", "width"),
      NumberFormat.parseNonNegative(args[3] ?? "", "height"),
      args[4] ?? ""
    );
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const rectangles = request.children.filter(
      (child): child is RectShape => child instanceof RectShape
    );
    const labels = request.children.filter(
      (child): child is TextShape => child instanceof TextShape
    );
    if (request.children.length !== 2 || rectangles.length !== 1 || labels.length !== 1) {
      throw new UserError("invalid box: expected exactly one <rect> and one <text>");
    }
    const rectangle = rectangles[0];
    const label = labels[0];
    if (rectangle === undefined || label === undefined) {
      throw new UserError("invalid box: missing rectangle or text");
    }
    if (
      rectangle.id !== `${request.id}-rect` ||
      label.id !== `${request.id}-label`
    ) {
      throw new UserError(
        `invalid box: required ids are ${request.id}-rect and ${request.id}-label`
      );
    }

    const box = BoxShape.adopt(request.id, rectangle, label);
    const attributes = new Map(request.attributes);
    attributes.delete("fill");
    SvgProviderSupport.applySvgAttributes(box, attributes, []);
    const fill = request.attributes.get("fill");
    if (fill !== undefined) {
      box.setFill(fill);
    }
    return box;
  }
}

