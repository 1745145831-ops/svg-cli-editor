import { UserError } from "../../shared/UserError.js";
import { Shape, type GeometryEntry } from "./Shape.js";

/**
 * Composite node. A group has the same client-facing operations as a leaf;
 * move/scale recurse over children and delete removes the whole subtree.
 */
export class GroupShape extends Shape {
  private readonly childShapes: Shape[] = [];

  public constructor(id: string) {
    super(id);
  }

  public override get typeName(): string {
    return "g";
  }

  public get children(): readonly Shape[] {
    return this.childShapes;
  }

  public get childCount(): number {
    return this.childShapes.length;
  }

  public get geometryAttributeNames(): readonly string[] {
    return [];
  }

  public get geometryEntries(): readonly GeometryEntry[] {
    return [];
  }

  public override get treeSummary(): string {
    return "";
  }

  public indexOf(shape: Shape): number {
    return this.childShapes.indexOf(shape);
  }

  public containsShape(candidate: Shape): boolean {
    for (const child of this.childShapes) {
      if (child === candidate) {
        return true;
      }
      if (child instanceof GroupShape && child.containsShape(candidate)) {
        return true;
      }
    }
    return false;
  }

  public appendChild(shape: Shape): void {
    this.insertChild(this.childShapes.length, shape);
  }

  public insertChild(index: number, shape: Shape): void {
    if (shape.parent !== null) {
      throw new Error(`shape ${shape.id} already has a parent`);
    }
    if (index < 0 || index > this.childShapes.length) {
      throw new RangeError(`insertion index out of range: ${index}`);
    }
    this.childShapes.splice(index, 0, shape);
    shape.attachToParent(this);
  }

  public removeChild(shape: Shape): void {
    const index = this.childShapes.indexOf(shape);
    if (index < 0) {
      throw new Error(`shape ${shape.id} is not a child of ${this.id}`);
    }
    this.childShapes.splice(index, 1);
    shape.attachToParent(null);
  }

  public moveChildToFront(shape: Shape): void {
    const index = this.indexOf(shape);
    if (index < 0) {
      throw new UserError(`no such shape: ${shape.id}`);
    }
    this.childShapes.splice(index, 1);
    this.childShapes.push(shape);
  }

  public moveChildToBack(shape: Shape): void {
    const index = this.indexOf(shape);
    if (index < 0) {
      throw new UserError(`no such shape: ${shape.id}`);
    }
    this.childShapes.splice(index, 1);
    this.childShapes.unshift(shape);
  }

  public override moveBy(dx: number, dy: number): void {
    for (const child of this.childShapes) {
      child.moveBy(dx, dy);
    }
  }

  public override scaleBy(factor: number): void {
    for (const child of this.childShapes) {
      child.scaleBy(factor);
    }
  }

  public override cloneShape(): GroupShape {
    const clone = new GroupShape(this.id);
    this.copyBaseTo(clone);
    for (const child of this.childShapes) {
      clone.appendChild(child.cloneShape());
    }
    return clone;
  }

  protected override applyGeometryAttribute(): boolean {
    return false;
  }
}
