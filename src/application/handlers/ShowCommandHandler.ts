import type { ShapeDetailsFormatter } from "../display/ShapeDetailsFormatter.js";
import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class ShowCommandHandler implements CommandHandler {
  public constructor(private readonly formatter: ShapeDetailsFormatter) {}

  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.exact(args, 1, "show <id>");
    const document = context.session.requireDocument();
    return { message: this.formatter.format(document, args[0] ?? "") };
  }
}
