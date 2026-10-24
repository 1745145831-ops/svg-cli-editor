import type { CommandResult } from "../../domain/command/CommandResult.js";
import { DeleteShapeCommand } from "../../domain/command/DeleteShapeCommand.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class DeleteCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 1, "delete <id>");
    context.session.requireDocument();
    return context.session.executeEdit(new DeleteShapeCommand(args[0] ?? ""));
  }
}
