import { AttributeDisplay } from "../../shared/AttributeDisplay.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { GroupShape } from "./GroupShape.js";

export type GeometryEntry = readonly [name: string, value: number];
export type SvgAttributeEntry = readonly [name: string, value: string];

const PRESENTATION_ATTRIBUTES = ["fill", "stroke", "stroke-width"] as const;
const PRESENTATION_ATTRIBUTE_SET: ReadonlySet<string> = new Set(PRESENTATION_ATTRIBUTES);

/**
 * Root of the shape hierarchy. A shape owns its identity, parent link and
 * presentation attributes; concrete subclasses own and mutate their geometry.
 * All structural mutation goes through SvgDocument, which keeps id indexes and
 * parent links consistent.
 */
export abstract class Shape {
  private readonly shapeId: string;
  private parentShape: GroupShape | null = null;
  private readonly presentation = new Map<string, string>();
  private readonly extraAttributes = new Map<string, string>();

  protected constructor(id: string) {
    Shape.assertValidId(id);
    this.shapeId = id;
  }

  public static assertValidId(id: string): void {
    if (id.length === 0) {
      throw new UserError("id must not be empty");
    }
    if (/\s/u.test(id)) {
      throw new UserError(`id must not contain whitespace: ${id}`);
    }
  }

  public get id(): string {
    return this.shapeId;
  }

  public get parent(): GroupShape | null {
    return this.parentShape;
  }

  /** Internal model wiring; use SvgDocument.attach/move/remove instead. */
  public attachToParent(parent: GroupShape | null): void {
    this.parentShape = parent;
  }

  public abstract get typeName(): string;

  public get svgTagName(): string {
    return this.typeName;
  }

  public abstract get geometryAttributeNames(): readonly string[];

  public abstract get geometryEntries(): readonly GeometryEntry[];

  public get position(): readonly [x: number, y: number] | null {
    return null;
  }

  /** Text nodes are the only shapes with element content rather than attributes. */
  public get svgTextContent(): string | null {
    return null;
  }

  public abstract moveBy(dx: number, dy: number): void;

  public abstract scaleBy(factor: number): void;

  public abstract cloneShape(): Shape;

  public abstract get treeSummary(): string;

  public get treeLabel(): string {
    return `${this.typeName}#${this.id}`;
  }

  public get presentationEntries(): readonly SvgAttributeEntry[] {
    const result: SvgAttributeEntry[] = [];
    for (const name of PRESENTATION_ATTRIBUTES) {
      const value = this.presentation.get(name);
      if (value !== undefined) {
        result.push([name, value]);
      }
    }
    return result;
  }

  public get extraAttributeEntries(): readonly SvgAttributeEntry[] {
    return [...this.extraAttributes.entries()];
  }

  public getAttributeValue(name: string): string | undefined {
    const presentationValue = this.presentation.get(name);
    if (presentationValue !== undefined) {
      return presentationValue;
    }
    for (const [geometryName, value] of this.geometryEntries) {
      if (geometryName === name) {
        return NumberFormat.format(value);
      }
    }
    return undefined;
  }

  public setAttribute(name: string, value: string): void {
    if (PRESENTATION_ATTRIBUTE_SET.has(name)) {
      this.writePresentationAttribute(name, value);
      return;
    }
    if (!this.applyGeometryAttribute(name, value)) {
      throw new UserError(`unknown attribute: ${name}`);
    }
  }

  public setPresentationAttribute(name: string, value: string): void {
    if (!PRESENTATION_ATTRIBUTE_SET.has(name)) {
      throw new UserError(`unknown attribute: ${name}`);
    }
    this.writePresentationAttribute(name, value);
  }

  public setExtraAttribute(name: string, value: string): void {
    if (name.length === 0) {
      throw new UserError("attribute name must not be empty");
    }
    this.extraAttributes.set(name, value);
  }

  public getSvgAttributes(): readonly SvgAttributeEntry[] {
    const result: SvgAttributeEntry[] = [["id", this.id]];
    for (const [name, value] of this.geometryEntries) {
      result.push([name, NumberFormat.format(value)]);
    }
    result.push(...this.presentationEntries);
    result.push(...this.extraAttributeEntries);
    return result;
  }

  public describeAttribute(name: string): string | undefined {
    const value = this.getAttributeValue(name);
    return value === undefined ? undefined : AttributeDisplay.format(name, value);
  }

  protected abstract applyGeometryAttribute(name: string, value: string): boolean;

  protected copyBaseTo(target: Shape): void {
    for (const [name, value] of this.presentation) {
      target.presentation.set(name, value);
    }
    for (const [name, value] of this.extraAttributes) {
      target.extraAttributes.set(name, value);
    }
  }

  protected get fillSuffix(): string {
    const fill = this.presentation.get("fill");
    return fill === undefined ? "" : ` fill=${fill}`;
  }

  private writePresentationAttribute(name: string, value: string): void {
    if (name === "stroke-width") {
      const width = NumberFormat.parseNonNegative(value, "stroke-width");
      this.presentation.set(name, NumberFormat.format(width));
      return;
    }
    if (value.length === 0) {
      throw new UserError(`${name} must not be empty`);
    }
    this.presentation.set(name, value);
  }
}
