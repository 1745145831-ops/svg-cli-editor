import { AttributeDisplay } from "../../shared/AttributeDisplay.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class SetAttributeCommand extends EditCommand {
  private shapeLabel = "";

  public constructor(
    private readonly shapeId: string,
    private readonly attribute: string,
    private readonly value: string
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const shape = this.requireShape(document, this.shapeId);
    this.shapeLabel = shape.treeLabel;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    shape.setAttribute(this.attribute, this.value);
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
