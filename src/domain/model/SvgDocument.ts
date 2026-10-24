import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import { DocumentMemento } from "./DocumentMemento.js";
import { GroupShape } from "./GroupShape.js";
import type { Shape } from "./Shape.js";

const ROOT_ID = "__document_root__";

/**
 * Aggregate root of the editor. It owns canvas dimensions, the shape tree and
 * the id index. External code may only mutate structure through this class.
 */
export class SvgDocument {
  private widthValue: number;
  private heightValue: number;
  private rootValue: GroupShape;
  private readonly shapesById = new Map<string, Shape>();

  public constructor(width: number, height: number) {
    NumberFormat.assertPositive(width, "width");
    NumberFormat.assertPositive(height, "height");
    this.widthValue = width;
    this.heightValue = height;
    this.rootValue = new GroupShape(ROOT_ID);
  }

  public get width(): number {
    return this.widthValue;
  }

  public get height(): number {
    return this.heightValue;
  }

  public get rootChildren(): readonly Shape[] {
    return this.rootValue.children;
  }

  public find(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  public has(id: string): boolean {
    return this.shapesById.has(id);
  }

  public get shapeCount(): number {
    return this.shapesById.size;
  }

  public isRootChild(shape: Shape): boolean {
    return shape.parent === this.rootValue;
  }

  public parentOf(shape: Shape): GroupShape {
    if (shape.parent === null) {
      throw new Error(`shape ${shape.id} has no parent`);
    }
    return shape.parent;
  }

  public resize(width: number, height: number): void {
    NumberFormat.assertPositive(width, "width");
    NumberFormat.assertPositive(height, "height");
    this.widthValue = width;
    this.heightValue = height;
  }

  /**
   * Registers a detached shape (and its subtree) under `parent`. Used for new
   * shapes and for children promoted out of an ungrouped container.
   */
  public attach(shape: Shape, parent?: GroupShape, index?: number): void {
    if (shape.parent !== null) {
      throw new Error(`shape ${shape.id} already has a parent`);
    }
    const target = parent ?? this.rootValue;
    this.assertSubtreeIdsFree(shape);
    target.insertChild(index ?? target.childCount, shape);
    this.indexSubtree(shape);
  }

  public remove(shape: Shape): void {
    if (shape.parent === null) {
      throw new Error(`shape ${shape.id} is not attached`);
    }
    shape.parent.removeChild(shape);
    this.unindexSubtree(shape);
  }

  /** Moves an already registered shape/subtree to another container. */
  public move(shape: Shape, parent: GroupShape, index?: number): void {
    if (parent === shape || (shape instanceof GroupShape && shape.containsShape(parent))) {
      throw new UserError(`cannot move a container into its own descendant: ${shape.id}`);
    }
    const oldParent = this.parentOf(shape);
    oldParent.removeChild(shape);
    parent.insertChild(index ?? parent.childCount, shape);
  }

  public createMemento(): DocumentMemento {
    return new DocumentMemento(
      this.widthValue,
      this.heightValue,
      this.rootValue.cloneShape()
    );
  }

  public restore(memento: DocumentMemento): void {
    this.widthValue = memento.width;
    this.heightValue = memento.height;
    this.rootValue = memento.createRootClone();
    this.shapesById.clear();
    for (const child of this.rootValue.children) {
      this.indexSubtree(child);
    }
  }

  private assertSubtreeIdsFree(shape: Shape): void {
    if (this.shapesById.has(shape.id)) {
      throw new UserError(`id already exists: ${shape.id}`);
    }
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.assertSubtreeIdsFree(child);
      }
    }
  }

  private indexSubtree(shape: Shape): void {
    if (this.shapesById.has(shape.id)) {
      throw new Error(`duplicate id while indexing: ${shape.id}`);
    }
    this.shapesById.set(shape.id, shape);
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.indexSubtree(child);
      }
    }
  }

  private unindexSubtree(shape: Shape): void {
    this.shapesById.delete(shape.id);
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.unindexSubtree(child);
      }
    }
  }
}
