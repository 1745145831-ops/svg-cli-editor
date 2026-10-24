import { UserError } from "../../shared/UserError.js";
import { GroupShape } from "../model/GroupShape.js";
import type { Shape } from "../model/Shape.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class CreateShapeCommand extends EditCommand {
  public constructor(
    private readonly shape: Shape,
    private readonly containerId?: string
  ) {
    super();
  }

  protected override validate(document: SvgDocument): void {
    if (document.has(this.shape.id)) {
      throw new UserError(`id already exists: ${this.shape.id}`);
    }
    if (this.containerId !== undefined) {
      const container = document.find(this.containerId);
      if (container === undefined) {
        throw new UserError(`no such container: ${this.containerId}`);
      }
      if (!(container instanceof GroupShape)) {
        throw new UserError(`not a container: ${this.containerId}`);
      }
    }
  }

  protected override apply(document: SvgDocument): CommandResult {
    if (this.containerId === undefined) {
      document.attach(this.shape);
      return { message: `${this.shape.treeLabel} created` };
    }
    const container = document.find(this.containerId);
    if (!(container instanceof GroupShape)) {
      throw new Error("container disappeared during command execution");
    }
    document.attach(this.shape, container);
    return {
      message: `${this.shape.treeLabel} created in ${container.treeLabel}`
    };
  }

  protected override buildUndoMessage(): string {
    return `${this.shape.treeLabel} removed`;
  }
}
