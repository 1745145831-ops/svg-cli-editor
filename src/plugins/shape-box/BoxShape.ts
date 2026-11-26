import { GroupShape } from "../../domain/model/GroupShape.js";
import { RectShape } from "../../domain/model/RectShape.js";
import { TextShape } from "../../domain/model/TextShape.js";

const LABEL_OFFSET_X = 20;
const LABEL_OFFSET_Y = 35;

/**
 * Composite shape plugin. It extends GroupShape so the existing Composite,
 * Memento and traversal code works unchanged, but it owns its two required
 * parts and exposes only domain methods to AttributeHandlers.
 */
export class BoxShape extends GroupShape {
  private constructor(
    id: string,
    private readonly rectangle: RectShape,
    private readonly labelShape: TextShape
  ) {
    super(id);
    this.setExtraAttribute("data-kind", "box");
    this.appendChild(rectangle);
    this.appendChild(labelShape);
    rectangle.lockStructure();
    labelShape.lockStructure();
  }

  public static create(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string
  ): BoxShape {
    return new BoxShape(
      id,
      new RectShape(`${id}-rect`, x, y, width, height),
      new TextShape(`${id}-label`, x + LABEL_OFFSET_X, y + LABEL_OFFSET_Y, label)
    );
  }

  /** Used by the SVG provider with already-validated child instances. */
  public static adopt(id: string, rectangle: RectShape, label: TextShape): BoxShape {
    return new BoxShape(id, rectangle, label);
  }

  public override get typeName(): string {
    return "box";
  }

  public override get svgTagName(): string {
    return "g";
  }

  public override get treeLabel(): string {
    return `g#${this.id}`;
  }

  public override get allowsUngroup(): boolean {
    return false;
  }

  public setFill(value: string): void {
    this.rectangle.setPresentationAttribute("fill", value);
  }

  public setLabel(value: string): void {
    this.labelShape.setAttribute("text", value);
  }

  public override getAttributeValue(name: string): string | undefined {
    if (name === "fill") {
      return this.rectangle.getAttributeValue("fill");
    }
    if (name === "label") {
      return this.labelShape.getAttributeValue("text");
    }
    return super.getAttributeValue(name);
  }

  public override cloneShape(): BoxShape {
    const clone = new BoxShape(
      this.id,
      this.rectangle.cloneShape(),
      this.labelShape.cloneShape()
    );
    this.copyBaseTo(clone);
    return clone;
  }
}
