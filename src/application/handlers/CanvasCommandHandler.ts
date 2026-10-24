import type { CommandResult } from "../../domain/command/CommandResult.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class CanvasCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.between(args, 0, 2, "canvas [width] [height]");
    const document = context.session.requireDocument();
    if (args.length === 0) {
      return {
        message: `canvas ${NumberFormat.format(document.width)}x` +
          `${NumberFormat.format(document.height)}`
      };
    }
    const width = NumberFormat.parsePositive(args[0] ?? "", "width");
    const height = NumberFormat.parsePositive(args[1] ?? "", "height");
    context.session.resizeDocument(width, height);
    return {
      message: `canvas resized to ${NumberFormat.format(width)}x${NumberFormat.format(height)}`
    };
  }
}
