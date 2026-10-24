import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class ScaleShapeCommand extends EditCommand {
  private shapeLabel = "";

  public constructor(
    private readonly shapeId: string,
    private readonly factor: number
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    if (!Number.isFinite(this.factor) || this.factor <= 0) {
      throw new UserError("scale factor must be positive");
    }
    const shape = this.requireShape(document, this.shapeId);
    this.shapeLabel = shape.treeLabel;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    shape.scaleBy(this.factor);
    return {
      message: `${shape.treeLabel} scaled by ${NumberFormat.format(this.factor)}`
    };
  }

  protected override buildUndoMessage(): string {
    return `${this.shapeLabel} scaled back by ` +
      `${NumberFormat.format(1 / this.factor)}`;
  }
}
