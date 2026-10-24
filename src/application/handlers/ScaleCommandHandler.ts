import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ScaleShapeCommand } from "../../domain/command/ScaleShapeCommand.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class ScaleCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 2, "scale <id> <factor>");
    context.session.requireDocument();
    const factor = NumberFormat.parse(args[1] ?? "", "factor");
    return context.session.executeEdit(
      new ScaleShapeCommand(args[0] ?? "", factor)
    );
  }
}
