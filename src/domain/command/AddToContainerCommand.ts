import { UserError } from "../../shared/UserError.js";
import { GroupShape } from "../model/GroupShape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class AddToContainerCommand extends EditCommand {
  private shapeLabel = "";

  public constructor(
    private readonly containerId: string,
    private readonly shapeId: string
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    const container = document.find(this.containerId);
    if (container === undefined) {
      throw new UserError(`no such container: ${this.containerId}`);
    }
    if (!(container instanceof GroupShape)) {
      throw new UserError(`not a container: ${this.containerId}`);
    }
    const shape = this.requireShape(document, this.shapeId);
    if (shape === container) {
      throw new UserError(`cannot move a container into itself: ${shape.id}`);
    }
    if (shape instanceof GroupShape && shape.containsShape(container)) {
      throw new UserError(`cannot move a container into its own descendant: ${shape.id}`);
    }
    this.shapeLabel = shape.treeLabel;
  }

  protected override apply(document: SvgDocument): CommandResult {
    const container = document.find(this.containerId);
    const shape = this.requireShape(document, this.shapeId);
    if (!(container instanceof GroupShape)) {
      throw new Error("validated container is not a group");
    }
    document.move(shape, container);
    return { message: `${shape.treeLabel} moved into ${container.treeLabel}` };
  }

  protected override buildUndoMessage(document: SvgDocument): string {
    const shape = document.find(this.shapeId);
    if (shape === undefined) {
      return `${this.shapeLabel} moved back`;
    }
    if (document.isRootChild(shape)) {
      return `${shape.treeLabel} moved back to canvas`;
    }
    return `${shape.treeLabel} moved back to ${document.parentOf(shape).treeLabel}`;
  }
}
