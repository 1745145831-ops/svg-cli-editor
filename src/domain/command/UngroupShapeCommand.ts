import { UserError } from "../../shared/UserError.js";
import { GroupShape } from "../model/GroupShape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class UngroupShapeCommand extends EditCommand {
  private groupLabel = "";
  private childCount = 0;

  public constructor(private readonly groupId: string) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const shape = this.requireShape(document, this.groupId);
    if (!(shape instanceof GroupShape)) {
      throw new UserError(`not a container: ${this.groupId}`);
    }
    if (document.isRootChild(shape)) {
      throw new UserError(`cannot ungroup top-level container: ${this.groupId}`);
    }
    this.groupLabel = shape.treeLabel;
    this.childCount = shape.childCount;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const group = this.requireShape(document, this.groupId);
    if (!(group instanceof GroupShape)) {
      throw new Error("validated ungroup target is not a group");
    }
    const parent = document.parentOf(group);
    const insertionIndex = parent.indexOf(group);
    const children = [...group.children];
    // Remove the whole subtree from the document (and the id index) first, then
    // promote the children. Re-attaching while their old ids are still indexed
    // would be rejected as a duplicate.
    document.remove(group);
    children.forEach((child, offset) => {
      group.removeChild(child);
      document.attach(child, parent, insertionIndex + offset);
    });
    return { message: `${group.treeLabel} ungrouped (${children.length} children)` };
  }

  protected override buildUndoMessage(): string {
    return `${this.groupLabel} regrouped with ${this.childCount} children`;
  }
}
