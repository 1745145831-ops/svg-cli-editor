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
    const provider = context.shapes.findByType(type);
    const parsed = this.extractContainer(
      type,
      args.slice(2),
      provider?.fixedCliArgumentCount
    );

    const shape = context.shapes.createFromCli({ type, id, args: parsed.params });
    return context.session.executeEdit(
      new CreateShapeCommand(shape, parsed.containerId)
    );
  }

  private extractContainer(
    type: string,
    rawParams: readonly string[],
    fixedArgumentCount: number | undefined
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
      // A provider with a fixed trailing text argument (text, box) may legitimately
      // receive the literal content "in". Do not turn that into a container clause.
      if (fixedArgumentCount === params.length) {
        return { params };
      }
      throw new UserError("expected a container id after 'in'");
    }
    return { params };
  }
}
