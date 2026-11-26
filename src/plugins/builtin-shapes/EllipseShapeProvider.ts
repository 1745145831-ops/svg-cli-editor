import { EllipseShape } from "../../domain/model/EllipseShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class EllipseShapeProvider implements ShapeProvider {
  public readonly shapeType = "ellipse";
  public readonly svgTags = ["ellipse"] as const;
  public readonly isContainer = false;

  public createFromCli(request: ShapeCreateRequest): Shape {
    const { id, args } = request;
    SvgProviderSupport.requireArgCount(
      "ellipse",
      args,
      4,
      5,
      "<id> <cx> <cy> <rx> <ry> [fill]"
    );
    const shape = new EllipseShape(
      id,
      NumberFormat.parse(args[0] ?? "", "cx"),
      NumberFormat.parse(args[1] ?? "", "cy"),
      NumberFormat.parseNonNegative(args[2] ?? "", "rx"),
      NumberFormat.parseNonNegative(args[3] ?? "", "ry")
    );
    SvgProviderSupport.optionalStyle(shape, args[4], "fill");
    return shape;
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const shape = new EllipseShape(
      request.id,
      SvgProviderSupport.svgNumber(request.attributes, "cx", 0),
      SvgProviderSupport.svgNumber(request.attributes, "cy", 0),
      SvgProviderSupport.svgDimension(request.attributes, "rx"),
      SvgProviderSupport.svgDimension(request.attributes, "ry")
    );
    SvgProviderSupport.applySvgAttributes(shape, request.attributes, [
      "cx",
      "cy",
      "rx",
      "ry"
    ]);
    return shape;
  }
}

