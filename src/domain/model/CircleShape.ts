import { NumberFormat } from "../../shared/NumberFormat.js";
import { Shape, type GeometryEntry } from "./Shape.js";

export class CircleShape extends Shape {
  private cxValue: number;
  private cyValue: number;
  private radiusValue: number;

  public constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    NumberFormat.assertNonNegative(radius, "r");
    this.cxValue = cx;
    this.cyValue = cy;
    this.radiusValue = radius;
  }

  public override get typeName(): string {
    return "circle";
  }

  public get geometryAttributeNames(): readonly string[] {
    return ["cx", "cy", "r"];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [
      ["cx", this.cxValue],
      ["cy", this.cyValue],
      ["r", this.radiusValue]
    ];
  }

  public override get position(): readonly [number, number] {
    return [this.cxValue, this.cyValue];
  }

  public override get treeSummary(): string {
    return `cx=${NumberFormat.format(this.cxValue)} cy=${NumberFormat.format(this.cyValue)} ` +
      `r=${NumberFormat.format(this.radiusValue)}${this.fillSuffix}`;
  }

  public override moveBy(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  public override scaleBy(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.radiusValue *= factor;
  }

  public override cloneShape(): CircleShape {
    const clone = new CircleShape(this.id, this.cxValue, this.cyValue, this.radiusValue);
    this.copyBaseTo(clone);
    return clone;
  }

  protected override applyGeometryAttribute(name: string, value: string): boolean {
    switch (name) {
      case "cx":
        this.cxValue = NumberFormat.parse(value, "cx");
        return true;
      case "cy":
        this.cyValue = NumberFormat.parse(value, "cy");
        return true;
      case "r":
        this.radiusValue = NumberFormat.parseNonNegative(value, "r");
        return true;
      default:
        return false;
    }
  }
}
