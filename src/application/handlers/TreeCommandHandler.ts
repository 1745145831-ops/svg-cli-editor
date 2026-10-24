import type { TreeRenderer } from "../display/TreeRenderer.js";
import type { CommandResult } from "../../domain/command/CommandResult.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class TreeCommandHandler implements CommandHandler {
  public constructor(private readonly renderer: TreeRenderer) {}

  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.between(args, 0, 1, "tree [id]");
    const document = context.session.requireDocument();
    return { message: this.renderer.render(document, args[0]) };
  }
}
