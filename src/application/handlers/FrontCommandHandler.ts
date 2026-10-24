import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ReorderShapeCommand } from "../../domain/command/ReorderShapeCommand.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class FrontCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 1, "front <id>");
    context.session.requireDocument();
    return context.session.executeEdit(
      new ReorderShapeCommand(args[0] ?? "", "front")
    );
  }
}
