import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class RedoCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 0, "redo");
    return context.session.redo();
  }
}
