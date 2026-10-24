import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class DeleteShapeCommand extends EditCommand {
  private deletedLabel = "";

  public constructor(private readonly shapeId: string) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const shape = this.requireShape(document, this.shapeId);
    this.deletedLabel = shape.treeLabel;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    document.remove(shape);
    return { message: `${shape.treeLabel} deleted` };
  }

  protected override buildUndoMessage(document: SvgDocument): string {
    const shape = document.find(this.shapeId);
    if (shape === undefined) {
      return `${this.deletedLabel} restored`;
    }
    if (document.isRootChild(shape)) {
      return `${shape.treeLabel} restored to canvas`;
    }
    return `${shape.treeLabel} restored into ${document.parentOf(shape).treeLabel}`;
  }
}
