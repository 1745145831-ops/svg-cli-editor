import type { CommandResult } from "../../domain/command/CommandResult.js";
import { AddToContainerCommand } from "../../domain/command/AddToContainerCommand.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class AddToCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 2, "addto <gid> <id>");
    context.session.requireDocument();
    return context.session.executeEdit(
      new AddToContainerCommand(args[0] ?? "", args[1] ?? "")
    );
  }
}
