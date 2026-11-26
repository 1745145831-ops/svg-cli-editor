import { AttributeDisplay } from "../../shared/AttributeDisplay.js";
import type { Shape } from "../model/Shape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

/**
 * Returns true when a plugin handler took responsibility. A handler error must
 * propagate (the EditCommand restores its before snapshot) rather than fall
 * back to the default white-list path.
 */
export type AttributeOverride = (
  document: SvgDocument,
  shape: Shape,
  attribute: string,
  value: string
) => boolean;

export class SetAttributeCommand extends EditCommand {
  private shapeLabel = "";

  public constructor(
    private readonly shapeId: string,
    private readonly attribute: string,
    private readonly value: string,
    private readonly override: AttributeOverride | null = null
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const shape = this.requireShape(document, this.shapeId);
    this.shapeLabel = shape.treeLabel;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    const handled = this.override?.(document, shape, this.attribute, this.value) ?? false;
    if (!handled) {
      shape.setAttribute(this.attribute, this.value);
    }
    const value = shape.getAttributeValue(this.attribute);
    return {
      message: `${shape.treeLabel} updated: ${this.attribute}=` +
        `${AttributeDisplay.formatOrUnset(this.attribute, value)}`
    };
  }

  protected override buildUndoMessage(document: SvgDocument): string {
    const shape = document.find(this.shapeId);
    const value = shape?.getAttributeValue(this.attribute);
    return `${this.shapeLabel} updated: ${this.attribute}=` +
      `${AttributeDisplay.formatOrUnset(this.attribute, value)}`;
  }
}
