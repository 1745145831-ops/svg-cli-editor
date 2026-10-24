import type { CommandResult } from "../../domain/command/CommandResult.js";
import { GroupShapesCommand } from "../../domain/command/GroupShapesCommand.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class GroupCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    ArgumentCheck.atLeast(args, 2, "group <newGid> <id1> <id2>...");
    context.session.requireDocument();
    const newGroupId = args[0] ?? "";
    return context.session.executeEdit(
      new GroupShapesCommand(newGroupId, args.slice(1))
    );
  }
}
