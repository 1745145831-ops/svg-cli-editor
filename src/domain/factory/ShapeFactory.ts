import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import { CircleShape } from "../model/CircleShape.js";
import { EllipseShape } from "../model/EllipseShape.js";
import { GroupShape } from "../model/GroupShape.js";
import { LineShape } from "../model/LineShape.js";
import { RectShape } from "../model/RectShape.js";
import type { Shape } from "../model/Shape.js";
import { TextShape } from "../model/TextShape.js";
import { SvgLength } from "./SvgLength.js";

const SVG_COMMON_ATTRIBUTES = new Set(["fill", "stroke", "stroke-width"]);

/**
 * The single type-name -> class dispatch point in the model. It is shared by
 * `create` parsing and SVG import so there is no duplicated `switch(tag)`.
 * TODO(refactor): replace with a ShapeProvider registry in the plugin phase.
 */
export class ShapeFactory {
  private static readonly GEOMETRY_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
    rect: ["x", "y", "width", "height"],
    circle: ["cx", "cy", "r"],
    ellipse: ["cx", "cy", "rx", "ry"],
    line: ["x1", "y1", "x2", "y2"],
    text: ["x", "y"],
    g: []
  };

  public createFromCreateArgs(type: string, id: string, args: readonly string[]): Shape {
    switch (type) {
      case "rect": {
        this.requireArgCount(type, args, 4, 5, "<id> <x> <y> <width> <height> [fill]");
        const shape = new RectShape(
          id,
          NumberFormat.parse(args[0] ?? "", "x"),
          NumberFormat.parse(args[1] ?? "", "y"),
          NumberFormat.parseNonNegative(args[2] ?? "", "width"),
          NumberFormat.parseNonNegative(args[3] ?? "", "height")
        );
        this.applyOptionalStyle(shape, args[4], "fill");
        return shape;
      }
      case "circle": {
        this.requireArgCount(type, args, 3, 4, "<id> <cx> <cy> <r> [fill]");
        const shape = new CircleShape(
          id,
          NumberFormat.parse(args[0] ?? "", "cx"),
          NumberFormat.parse(args[1] ?? "", "cy"),
          NumberFormat.parseNonNegative(args[2] ?? "", "r")
        );
        this.applyOptionalStyle(shape, args[3], "fill");
        return shape;
      }
      case "ellipse": {
        this.requireArgCount(type, args, 4, 5, "<id> <cx> <cy> <rx> <ry> [fill]");
        const shape = new EllipseShape(
          id,
          NumberFormat.parse(args[0] ?? "", "cx"),
          NumberFormat.parse(args[1] ?? "", "cy"),
          NumberFormat.parseNonNegative(args[2] ?? "", "rx"),
          NumberFormat.parseNonNegative(args[3] ?? "", "ry")
        );
        this.applyOptionalStyle(shape, args[4], "fill");
        return shape;
      }
      case "line": {
        this.requireArgCount(type, args, 4, 5, "<id> <x1> <y1> <x2> <y2> [stroke]");
        const shape = new LineShape(
          id,
          NumberFormat.parse(args[0] ?? "", "x1"),
          NumberFormat.parse(args[1] ?? "", "y1"),
          NumberFormat.parse(args[2] ?? "", "x2"),
          NumberFormat.parse(args[3] ?? "", "y2")
        );
        this.applyOptionalStyle(shape, args[4], "stroke");
        return shape;
      }
      case "text": {
        this.requireArgCount(type, args, 3, 3, '<id> <x> <y> "<content>"');
        return new TextShape(
          id,
          NumberFormat.parse(args[0] ?? "", "x"),
          NumberFormat.parse(args[1] ?? "", "y"),
          args[2] ?? ""
        );
      }
      case "g":
        this.requireArgCount(type, args, 0, 0, "<id>");
        return new GroupShape(id);
      default:
        throw new UserError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  /**
   * Creates one element from SVG attributes. Children and text content are
   * supplied by the reader; unknown attributes are preserved as extras so a
   * read -> save round trip does not silently discard presentation data.
   */
  public createFromSvgElement(
    tag: string,
    id: string,
    attributes: ReadonlyMap<string, string>,
    textContent = ""
  ): Shape {
    const shape = this.createSvgShape(tag, id, attributes, textContent);
    this.applySvgAttributes(shape, tag, attributes);
    return shape;
  }

  public isContainerTag(tag: string): boolean {
    return tag === "g";
  }

  public isSupportedSvgTag(tag: string): boolean {
    return Object.hasOwn(ShapeFactory.GEOMETRY_ATTRIBUTES, tag);
  }

  private createSvgShape(
    tag: string,
    id: string,
    attributes: ReadonlyMap<string, string>,
    textContent: string
  ): Shape {
    switch (tag) {
      case "rect":
        return new RectShape(
          id,
          this.svgNumber(attributes, "x", 0),
          this.svgNumber(attributes, "y", 0),
          this.svgDimension(attributes, "width"),
          this.svgDimension(attributes, "height")
        );
      case "circle":
        return new CircleShape(
          id,
          this.svgNumber(attributes, "cx", 0),
          this.svgNumber(attributes, "cy", 0),
          this.svgDimension(attributes, "r")
        );
      case "ellipse":
        return new EllipseShape(
          id,
          this.svgNumber(attributes, "cx", 0),
          this.svgNumber(attributes, "cy", 0),
          this.svgDimension(attributes, "rx"),
          this.svgDimension(attributes, "ry")
        );
      case "line":
        return new LineShape(
          id,
          this.svgNumber(attributes, "x1", 0),
          this.svgNumber(attributes, "y1", 0),
          this.svgNumber(attributes, "x2", 0),
          this.svgNumber(attributes, "y2", 0)
        );
      case "text":
        return new TextShape(
          id,
          this.svgNumber(attributes, "x", 0),
          this.svgNumber(attributes, "y", 0),
          textContent
        );
      case "g":
        return new GroupShape(id);
      default:
        throw new UserError(`unsupported SVG element: ${tag}`);
    }
  }

  private applySvgAttributes(
    shape: Shape,
    tag: string,
    attributes: ReadonlyMap<string, string>
  ): void {
    for (const name of SVG_COMMON_ATTRIBUTES) {
      const value = attributes.get(name);
      if (value !== undefined) {
        if (name === "stroke-width") {
          shape.setPresentationAttribute(
            name,
            NumberFormat.format(SvgLength.toUserUnits(value, name))
          );
        } else {
          shape.setPresentationAttribute(name, value);
        }
      }
    }
    const known = new Set<string>([
      "id",
      ...SVG_COMMON_ATTRIBUTES,
      ...(ShapeFactory.GEOMETRY_ATTRIBUTES[tag] ?? [])
    ]);
    for (const [name, value] of attributes) {
      if (!known.has(name)) {
        shape.setExtraAttribute(name, value);
      }
    }
  }

  private applyOptionalStyle(shape: Shape, style: string | undefined, attribute: string): void {
    if (style !== undefined) {
      shape.setPresentationAttribute(attribute, style);
    }
  }

  private requireArgCount(
    type: string,
    args: readonly string[],
    minimum: number,
    maximum: number,
    usage: string
  ): void {
    if (args.length < minimum || args.length > maximum) {
      throw new UserError(`usage: create ${type} ${usage}`);
    }
  }

  private svgNumber(
    attributes: ReadonlyMap<string, string>,
    name: string,
    fallback: number
  ): number {
    const raw = attributes.get(name);
    return raw === undefined ? fallback : SvgLength.toUserUnits(raw, name);
  }

  private svgDimension(attributes: ReadonlyMap<string, string>, name: string): number {
    const raw = attributes.get(name);
    return raw === undefined ? 0 : SvgLength.toUserUnits(raw, name);
  }
}
