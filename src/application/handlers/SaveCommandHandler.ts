import type { CommandResult } from "../../domain/command/CommandResult.js";
import { UserError } from "../../shared/UserError.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class SaveCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.between(args, 0, 1, "save [file.svg]");
    const document = context.session.requireDocument();
    const filePath = args[0] ?? context.session.currentFilePath;
    if (filePath === null || filePath.length === 0) {
      throw new UserError("no file path. use 'save <file.svg>'");
    }
    const count = document.shapeCount;
    context.gateway.write(document, filePath);
    context.session.markSaved(filePath);
    return { message: `saved to ${filePath} (${count} elements)` };
  }
}
