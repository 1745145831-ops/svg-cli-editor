import { UserError } from "../../shared/UserError.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class GroupShapesCommand extends EditCommand {
  private selectedShapes: Shape[] = [];

  public constructor(
    private readonly newGroupId: string,
    private readonly shapeIds: readonly string[]
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    Shape.assertValidId(this.newGroupId);
    if (document.has(this.newGroupId)) {
      throw new UserError(`id already exists: ${this.newGroupId}`);
    }
    if (this.shapeIds.length === 0) {
      throw new UserError("group needs at least one shape");
    }

    const seen = new Set<string>();
    const shapes: Shape[] = [];
    for (const id of this.shapeIds) {
      if (seen.has(id)) {
        throw new UserError(`duplicate id in group: ${id}`);
      }
      seen.add(id);
      shapes.push(this.requireShape(document, id));
    }

    for (const possibleAncestor of shapes) {
      if (!(possibleAncestor instanceof GroupShape)) {
        continue;
      }
      for (const possibleDescendant of shapes) {
        if (
          possibleAncestor !== possibleDescendant &&
          possibleAncestor.containsShape(possibleDescendant)
        ) {
          throw new UserError(
            `cannot group a container into its own descendant: ${possibleAncestor.id}`
          );
        }
      }
    }

    const order = new Map<Shape, number>();
    document.documentOrder().forEach((shape, index) => {
      order.set(shape, index);
    });
    shapes.sort((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0));
    this.selectedShapes = shapes;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const first = this.selectedShapes[0];
    if (first === undefined) {
      throw new Error("validated group command has no shapes");
    }
    const parent = document.parentOf(first);
    const insertionIndex = parent.indexOf(first);
    const group = new GroupShape(this.newGroupId);
    document.attach(group, parent, insertionIndex);
    for (const shape of this.selectedShapes) {
      document.move(shape, group);
    }
    return {
      message: `${group.treeLabel} created with ${group.childCount} children`
    };
  }

  protected override buildUndoMessage(): string {
    return `g#${this.newGroupId} removed; ${this.shapeIds.length} shapes restored`;
  }
}
