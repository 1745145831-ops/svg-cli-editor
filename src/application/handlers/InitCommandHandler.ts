import type { CommandResult } from "../../domain/command/CommandResult.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class InitCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.between(args, 0, 2, "init [width] [height]");
    let width = 800;
    let height = 600;
    if (args.length >= 1) {
      width = NumberFormat.parsePositive(args[0] ?? "", "width");
    }
    if (args.length === 2) {
      height = NumberFormat.parsePositive(args[1] ?? "", "height");
    }
    context.session.initialize(width, height);
    return {
      message: `canvas ${NumberFormat.format(width)}x${NumberFormat.format(height)} created`
    };
  }
}
