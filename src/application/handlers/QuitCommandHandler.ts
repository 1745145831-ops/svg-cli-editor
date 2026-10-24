import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class QuitCommandHandler implements CommandHandler {
  public execute(args: readonly string[], _context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 0, "quit");
    return { message: "", exit: true };
  }
}
