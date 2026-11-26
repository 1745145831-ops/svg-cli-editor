import { TreeRenderer } from "../display/TreeRenderer.js";
import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class TreeCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.between(args, 0, 1, "tree [id]");
    const document = context.session.requireDocument();
    const renderer = new TreeRenderer(context.decorators);
    return { message: renderer.render(document, args[0]) };
  }
}
