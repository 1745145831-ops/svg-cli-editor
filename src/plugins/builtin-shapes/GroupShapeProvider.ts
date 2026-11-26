import { GroupShape } from "../../domain/model/GroupShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { ShapeCreateRequest, ShapeProvider, SvgShapeRequest } from "../../kernel/plugin/ShapeProvider.js";
import { SvgProviderSupport } from "../../kernel/plugin/SvgProviderSupport.js";

export class GroupShapeProvider implements ShapeProvider {
  public readonly shapeType = "g";
  public readonly svgTags = ["g"] as const;
  public readonly isContainer = true;
  public readonly svgPriority = 0;

  public createFromCli(request: ShapeCreateRequest): Shape {
    SvgProviderSupport.requireArgCount("g", request.args, 0, 0, "<id>");
    return new GroupShape(request.id);
  }

  public createFromSvg(request: SvgShapeRequest): Shape {
    const group = new GroupShape(request.id);
    SvgProviderSupport.applySvgAttributes(group, request.attributes, []);
    for (const child of request.children) {
      group.appendChild(child);
    }
    return group;
  }
}

