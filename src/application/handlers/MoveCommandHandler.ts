import type { CommandResult } from "../../domain/command/CommandResult.js";
import { MoveShapeCommand } from "../../domain/command/MoveShapeCommand.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class MoveCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 3, "move <id> <dx> <dy>");
    context.session.requireDocument();
    const dx = NumberFormat.parse(args[1] ?? "", "dx");
    const dy = NumberFormat.parse(args[2] ?? "", "dy");
    return context.session.executeEdit(
      new MoveShapeCommand(args[0] ?? "", dx, dy)
    );
  }
}
