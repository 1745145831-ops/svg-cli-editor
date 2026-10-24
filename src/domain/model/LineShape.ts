import { NumberFormat } from "../../shared/NumberFormat.js";
import { Shape, type GeometryEntry } from "./Shape.js";

export class LineShape extends Shape {
  private x1Value: number;
  private y1Value: number;
  private x2Value: number;
  private y2Value: number;

  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  public override get typeName(): string {
    return "line";
  }

  public get geometryAttributeNames(): readonly string[] {
    return ["x1", "y1", "x2", "y2"];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [
      ["x1", this.x1Value],
      ["y1", this.y1Value],
      ["x2", this.x2Value],
      ["y2", this.y2Value]
    ];
  }

  public override get position(): readonly [number, number] {
    return [this.x1Value, this.y1Value];
  }

  public override get treeSummary(): string {
    return `(${NumberFormat.format(this.x1Value)},${NumberFormat.format(this.y1Value)}) -> ` +
      `(${NumberFormat.format(this.x2Value)},${NumberFormat.format(this.y2Value)})`;
  }

  public override moveBy(dx: number, dy: number): void {
    this.x1Value += dx;
    this.y1Value += dy;
    this.x2Value += dx;
    this.y2Value += dy;
  }

  public override scaleBy(factor: number): void {
    this.x1Value *= factor;
    this.y1Value *= factor;
    this.x2Value *= factor;
    this.y2Value *= factor;
  }

  public override cloneShape(): LineShape {
    const clone = new LineShape(
      this.id,
      this.x1Value,
      this.y1Value,
      this.x2Value,
      this.y2Value
    );
    this.copyBaseTo(clone);
    return clone;
  }

  protected override applyGeometryAttribute(name: string, value: string): boolean {
    switch (name) {
      case "x1":
        this.x1Value = NumberFormat.parse(value, "x1");
        return true;
      case "y1":
        this.y1Value = NumberFormat.parse(value, "y1");
        return true;
      case "x2":
        this.x2Value = NumberFormat.parse(value, "x2");
        return true;
      case "y2":
        this.y2Value = NumberFormat.parse(value, "y2");
        return true;
      default:
        return false;
    }
  }
}
