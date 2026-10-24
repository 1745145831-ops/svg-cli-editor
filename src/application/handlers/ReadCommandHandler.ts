import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class ReadCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 1, "read <file.svg>");
    const filePath = args[0] ?? "";
    const result = context.gateway.read(filePath);
    context.session.load(result.document, filePath);
    return {
      warnings: result.warnings,
      message: `read ${filePath} (${result.document.shapeCount} elements)`
    };
  }
}
