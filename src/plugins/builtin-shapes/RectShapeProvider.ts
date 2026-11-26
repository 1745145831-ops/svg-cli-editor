import { RectShape } from "../../domain/model/RectShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class RectShapeProvider implements ShapeProvider {
  public readonly shapeType = "rect";
  public readonly svgTags = ["rect"] as const;
  public readonly isContainer = false;

  public createFromCli(request: ShapeCreateRequest): Shape {
    const { id, args } = request;
    SvgProviderSupport.requireArgCount(
      "rect",
      args,
      4,
      5,
      "<id> <x> <y> <width> <height> [fill]"
    );
    const shape = new RectShape(
      id,
      NumberFormat.parse(args[0] ?? "", "x"),
      NumberFormat.parse(args[1] ?? "", "y"),
      NumberFormat.parseNonNegative(args[2] ?? "", "width"),
      NumberFormat.parseNonNegative(args[3] ?? "", "height")
    );
    SvgProviderSupport.optionalStyle(shape, args[4], "fill");
    return shape;
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const shape = new RectShape(
      request.id,
      SvgProviderSupport.svgNumber(request.attributes, "x", 0),
      SvgProviderSupport.svgNumber(request.attributes, "y", 0),
      SvgProviderSupport.svgDimension(request.attributes, "width"),
      SvgProviderSupport.svgDimension(request.attributes, "height")
    );
    SvgProviderSupport.applySvgAttributes(shape, request.attributes, [
      "x",
      "y",
      "width",
      "height"
    ]);
    return shape;
  }
}

