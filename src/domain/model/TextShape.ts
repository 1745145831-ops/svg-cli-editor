import { NumberFormat } from "../../shared/NumberFormat.js";
import { Shape, type GeometryEntry } from "./Shape.js";

export class TextShape extends Shape {
  private xValue: number;
  private yValue: number;
  private contentValue: string;

  public constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.xValue = x;
    this.yValue = y;
    this.contentValue = content;
  }

  public override get typeName(): string {
    return "text";
  }

  public get content(): string {
    return this.contentValue;
  }

  public override get svgTextContent(): string {
    return this.contentValue;
  }

  public get geometryAttributeNames(): readonly string[] {
    return ["x", "y"];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [
      ["x", this.xValue],
      ["y", this.yValue]
    ];
  }

  public override get position(): readonly [number, number] {
    return [this.xValue, this.yValue];
  }

  public override get treeSummary(): string {
    return `(${NumberFormat.format(this.xValue)},${NumberFormat.format(this.yValue)}) ` +
      `${JSON.stringify(this.contentValue)}${this.fillSuffix}`;
  }

  public override moveBy(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  public override scaleBy(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
  }

  public override cloneShape(): TextShape {
    const clone = new TextShape(this.id, this.xValue, this.yValue, this.contentValue);
    this.copyBaseTo(clone);
    return clone;
  }

  public override setAttribute(name: string, value: string): void {
    if (name === "text") {
      this.contentValue = value;
      return;
    }
    super.setAttribute(name, value);
  }

  public override getAttributeValue(name: string): string | undefined {
    if (name === "text") {
      return this.contentValue;
    }
    return super.getAttributeValue(name);
  }

  protected override applyGeometryAttribute(name: string, value: string): boolean {
    switch (name) {
      case "x":
        this.xValue = NumberFormat.parse(value, "x");
        return true;
      case "y":
        this.yValue = NumberFormat.parse(value, "y");
        return true;
      default:
        return false;
    }
  }
}
