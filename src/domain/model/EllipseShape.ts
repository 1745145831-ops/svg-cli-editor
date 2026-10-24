import { NumberFormat } from "../../shared/NumberFormat.js";
import { Shape, type GeometryEntry } from "./Shape.js";

export class EllipseShape extends Shape {
  private cxValue: number;
  private cyValue: number;
  private rxValue: number;
  private ryValue: number;

  public constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id);
    NumberFormat.assertNonNegative(rx, "rx");
    NumberFormat.assertNonNegative(ry, "ry");
    this.cxValue = cx;
    this.cyValue = cy;
    this.rxValue = rx;
    this.ryValue = ry;
  }

  public override get typeName(): string {
    return "ellipse";
  }

  public get geometryAttributeNames(): readonly string[] {
    return ["cx", "cy", "rx", "ry"];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [
      ["cx", this.cxValue],
      ["cy", this.cyValue],
      ["rx", this.rxValue],
      ["ry", this.ryValue]
    ];
  }

  public override get position(): readonly [number, number] {
    return [this.cxValue, this.cyValue];
  }

  public override get treeSummary(): string {
    return `cx=${NumberFormat.format(this.cxValue)} cy=${NumberFormat.format(this.cyValue)} ` +
      `rx=${NumberFormat.format(this.rxValue)} ry=${NumberFormat.format(this.ryValue)}` +
      this.fillSuffix;
  }

  public override moveBy(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  public override scaleBy(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.rxValue *= factor;
    this.ryValue *= factor;
  }

  public override cloneShape(): EllipseShape {
    const clone = new EllipseShape(
      this.id,
      this.cxValue,
      this.cyValue,
      this.rxValue,
      this.ryValue
    );
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
      case "rx":
        this.rxValue = NumberFormat.parseNonNegative(value, "rx");
        return true;
      case "ry":
        this.ryValue = NumberFormat.parseNonNegative(value, "ry");
        return true;
      default:
        return false;
    }
  }
}
