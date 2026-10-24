import { NumberFormat } from "../../shared/NumberFormat.js";
import { Shape, type GeometryEntry } from "./Shape.js";

export class RectShape extends Shape {
  private xValue: number;
  private yValue: number;
  private widthValue: number;
  private heightValue: number;

  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    NumberFormat.assertNonNegative(width, "width");
    NumberFormat.assertNonNegative(height, "height");
    this.xValue = x;
    this.yValue = y;
    this.widthValue = width;
    this.heightValue = height;
  }

  public override get typeName(): string {
    return "rect";
  }

  public get geometryAttributeNames(): readonly string[] {
    return ["x", "y", "width", "height"];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [
      ["x", this.xValue],
      ["y", this.yValue],
      ["width", this.widthValue],
      ["height", this.heightValue]
    ];
  }

  public override get position(): readonly [number, number] {
    return [this.xValue, this.yValue];
  }

  public override get treeSummary(): string {
    return `x=${NumberFormat.format(this.xValue)} y=${NumberFormat.format(this.yValue)} ` +
      `w=${NumberFormat.format(this.widthValue)} h=${NumberFormat.format(this.heightValue)}` +
      this.fillSuffix;
  }

  public override moveBy(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  public override scaleBy(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
    this.widthValue *= factor;
    this.heightValue *= factor;
  }

  public override cloneShape(): RectShape {
    const clone = new RectShape(
      this.id,
      this.xValue,
      this.yValue,
      this.widthValue,
      this.heightValue
    );
    this.copyBaseTo(clone);
    return clone;
  }

  protected override applyGeometryAttribute(name: string, value: string): boolean {
    switch (name) {
      case "x":
        this.xValue = NumberFormat.parse(value, "x");
        return true;
      case "y":
        this.yValue = NumberFormat.parse(value, "y");
        return true;
      case "width":
        this.widthValue = NumberFormat.parseNonNegative(value, "width");
        return true;
      case "height":
        this.heightValue = NumberFormat.parseNonNegative(value, "height");
        return true;
      default:
        return false;
    }
  }
}
