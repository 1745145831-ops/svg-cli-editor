import { CircleShape } from "../../domain/model/CircleShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class CircleShapeProvider implements ShapeProvider {
  public readonly shapeType = "circle";
  public readonly svgTags = ["circle"] as const;
  public readonly isContainer = false;

  public createFromCli(request: ShapeCreateRequest): Shape {
    const { id, args } = request;
    SvgProviderSupport.requireArgCount(
      "circle",
      args,
      3,
      4,
      "<id> <cx> <cy> <r> [fill]"
    );
    const shape = new CircleShape(
      id,
      NumberFormat.parse(args[0] ?? "", "cx"),
      NumberFormat.parse(args[1] ?? "", "cy"),
      NumberFormat.parseNonNegative(args[2] ?? "", "r")
    );
    SvgProviderSupport.optionalStyle(shape, args[3], "fill");
    return shape;
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const shape = new CircleShape(
      request.id,
      SvgProviderSupport.svgNumber(request.attributes, "cx", 0),
      SvgProviderSupport.svgNumber(request.attributes, "cy", 0),
      SvgProviderSupport.svgDimension(request.attributes, "r")
    );
    SvgProviderSupport.applySvgAttributes(shape, request.attributes, ["cx", "cy", "r"]);
    return shape;
  }
}

