import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export type ReorderDirection = "front" | "back";

export class ReorderShapeCommand extends EditCommand {
  private shapeLabel = "";
  private previousIndex = 0;

  public constructor(
    private readonly shapeId: string,
    private readonly direction: ReorderDirection
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const shape = this.requireShape(document, this.shapeId);
    const parent = document.parentOf(shape);
    this.shapeLabel = shape.treeLabel;
    this.previousIndex = parent.indexOf(shape);
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    const parent = document.parentOf(shape);
    if (this.direction === "front") {
      parent.moveChildToFront(shape);
    } else {
      parent.moveChildToBack(shape);
    }
    return { message: `${shape.treeLabel} moved to ${this.direction}` };
  }

  protected override buildUndoMessage(): string {
    return `${this.shapeLabel} moved back to position ${this.previousIndex + 1}`;
  }
}
