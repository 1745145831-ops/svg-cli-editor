import type { CommandResult } from "../../domain/command/CommandResult.js";
import { UngroupShapeCommand } from "../../domain/command/UngroupShapeCommand.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class UngroupCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 1, "ungroup <gid>");
    context.session.requireDocument();
    return context.session.executeEdit(new UngroupShapeCommand(args[0] ?? ""));
  }
}
