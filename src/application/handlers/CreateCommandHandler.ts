import { CreateShapeCommand } from "../../domain/command/CreateShapeCommand.js";
import type { CommandResult } from "../../domain/command/CommandResult.js";
import { UserError } from "../../shared/UserError.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class CreateCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.atLeast(
      args,
      2,
      'create <type> <id> [params...] [in <containerId>]'
    );
    context.session.requireDocument();
    const type = args[0] ?? "";
    const id = args[1] ?? "";
    const parsed = this.extractContainer(type, args.slice(2));

    const shape = context.shapeFactory.createFromCreateArgs(type, id, parsed.params);
    return context.session.executeEdit(
      new CreateShapeCommand(shape, parsed.containerId)
    );
  }

  private extractContainer(
    type: string,
    rawParams: readonly string[]
  ): { params: readonly string[]; containerId?: string } {
    const params = [...rawParams];
    const last = params[params.length - 1];
    if (params.length >= 2 && params[params.length - 2] === "in") {
      const containerId = last;
      if (containerId === undefined || containerId.length === 0) {
        throw new UserError("expected a container id after 'in'");
      }
      return { params: params.slice(0, -2), containerId };
    }
    if (last === "in") {
      const isTextContent = type === "text" && params.length === 3;
      if (!isTextContent) {
        throw new UserError("expected a container id after 'in'");
      }
    }
    return { params };
  }
}
