import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class MoveShapeCommand extends EditCommand {
  private shapeLabel = "";
  private oldPosition: readonly [number, number] | null = null;

  public constructor(
    private readonly shapeId: string,
    private readonly dx: number,
    private readonly dy: number
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    if (!Number.isFinite(this.dx) || !Number.isFinite(this.dy)) {
      throw new UserError("move deltas must be finite numbers");
    }
    const shape = this.requireShape(document, this.shapeId);
    this.shapeLabel = shape.treeLabel;
    this.oldPosition = shape.position;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.requireShape(document, this.shapeId);
    shape.moveBy(this.dx, this.dy);
    const delta = `(${NumberFormat.format(this.dx)},${NumberFormat.format(this.dy)})`;
    if (shape.position === null) {
      return { message: `${shape.treeLabel} moved by ${delta}` };
    }
    return {
      message: `${shape.treeLabel} moved to (${NumberFormat.format(shape.position[0])},` +
        `${NumberFormat.format(shape.position[1])})`
    };
  }

  protected override buildUndoMessage(): string {
    if (this.oldPosition === null) {
      return `${this.shapeLabel} moved back by ` +
        `(${NumberFormat.format(-this.dx)},${NumberFormat.format(-this.dy)})`;
    }
    return `${this.shapeLabel} moved back to ` +
      `(${NumberFormat.format(this.oldPosition[0])},${NumberFormat.format(this.oldPosition[1])})`;
  }
}
