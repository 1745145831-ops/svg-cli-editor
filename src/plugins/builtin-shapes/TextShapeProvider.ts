import type { Shape } from "../../domain/model/Shape.js";
import { TextShape } from "../../domain/model/TextShape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class TextShapeProvider implements ShapeProvider {
  public readonly shapeType = "text";
  public readonly svgTags = ["text"] as const;
  public readonly isContainer = false;
  public readonly fixedCliArgumentCount = 3;

  public createFromCli(request: ShapeCreateRequest): Shape {
    const { id, args } = request;
    SvgProviderSupport.requireArgCount(
      "text",
      args,
      3,
      3,
      '<id> <x> <y> "<content>"'
    );
    return new TextShape(
      id,
      NumberFormat.parse(args[0] ?? "", "x"),
      NumberFormat.parse(args[1] ?? "", "y"),
      args[2] ?? ""
    );
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const shape = new TextShape(
      request.id,
      SvgProviderSupport.svgNumber(request.attributes, "x", 0),
      SvgProviderSupport.svgNumber(request.attributes, "y", 0),
      request.textContent
    );
    SvgProviderSupport.applySvgAttributes(shape, request.attributes, ["x", "y"]);
    return shape;
  }
}

