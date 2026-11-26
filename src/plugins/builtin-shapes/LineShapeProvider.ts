import { LineShape } from "../../domain/model/LineShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class LineShapeProvider implements ShapeProvider {
  public readonly shapeType = "line";
  public readonly svgTags = ["line"] as const;
  public readonly isContainer = false;

  public createFromCli(request: ShapeCreateRequest): Shape {
    const { id, args } = request;
    SvgProviderSupport.requireArgCount(
      "line",
      args,
      4,
      5,
      "<id> <x1> <y1> <x2> <y2> [stroke]"
    );
    const shape = new LineShape(
      id,
      NumberFormat.parse(args[0] ?? "", "x1"),
      NumberFormat.parse(args[1] ?? "", "y1"),
      NumberFormat.parse(args[2] ?? "", "x2"),
      NumberFormat.parse(args[3] ?? "", "y2")
    );
    SvgProviderSupport.optionalStyle(shape, args[4], "stroke");
    return shape;
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const shape = new LineShape(
      request.id,
      SvgProviderSupport.svgNumber(request.attributes, "x1", 0),
      SvgProviderSupport.svgNumber(request.attributes, "y1", 0),
      SvgProviderSupport.svgNumber(request.attributes, "x2", 0),
      SvgProviderSupport.svgNumber(request.attributes, "y2", 0)
    );
    SvgProviderSupport.applySvgAttributes(shape, request.attributes, [
      "x1",
      "y1",
      "x2",
      "y2"
    ]);
    return shape;
  }
}

