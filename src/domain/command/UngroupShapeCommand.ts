import { UserError } from "../../shared/UserError.js";
import { GroupShape } from "../model/GroupShape.js";
import type { Shape } from "../model/Shape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

const INHERITED_EXTRA_ATTRIBUTES = [
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "text-anchor",
  "dominant-baseline",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "fill-opacity",
  "stroke-opacity",
  "color",
  "visibility"
] as const;

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
      this.transferInheritedState(group, child);
      group.removeChild(child);
      document.attach(child, parent, insertionIndex + offset);
    });
    return { message: `${group.treeLabel} ungrouped (${children.length} children)` };
  }

  protected override buildUndoMessage(): string {
    return `${this.groupLabel} regrouped with ${this.childCount} children`;
  }

  /**
   * A group can carry presentation attributes and a transform. When the group
   * disappears, copy the inheritable values to direct children and compose the
   * transform string so the promoted subtree keeps its rendered placement.
   */
  private transferInheritedState(group: GroupShape, child: Shape): void {
    for (const [name, value] of group.presentationEntries) {
      if (child.getAttributeValue(name) === undefined) {
        child.setPresentationAttribute(name, value);
      }
    }
    for (const name of INHERITED_EXTRA_ATTRIBUTES) {
      const value = group.getExtraAttributeValue(name);
      if (value !== undefined && child.getExtraAttributeValue(name) === undefined) {
        child.setExtraAttribute(name, value);
      }
    }
    for (const [name, value] of group.extraAttributeEntries) {
      if (name.startsWith("xmlns:") && child.getExtraAttributeValue(name) === undefined) {
        child.setExtraAttribute(name, value);
      }
    }
    const groupTransform = group.getExtraAttributeValue("transform");
    if (groupTransform !== undefined) {
      const childTransform = child.getExtraAttributeValue("transform");
      child.setExtraAttribute(
        "transform",
        childTransform === undefined ? groupTransform : `${groupTransform} ${childTransform}`
      );
    }
  }
}
