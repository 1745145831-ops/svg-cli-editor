import { HelpText } from "../display/HelpText.js";
import type { CommandResult } from "../../domain/command/CommandResult.js";
import { UserError } from "../../shared/UserError.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class HelpCommandHandler implements CommandHandler {
  public execute(args: readonly string[], _context: CommandContext): CommandResult {
    if (args.length !== 0) {
      throw new UserError("usage: help");
    }
    ArgumentCheck.exact(args, 0, "help");
    return { message: HelpText.render() };
  }
}
