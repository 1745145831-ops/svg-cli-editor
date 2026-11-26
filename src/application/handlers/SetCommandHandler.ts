import type { CommandResult } from "../../domain/command/CommandResult.js";
import { SetAttributeCommand } from "../../domain/command/SetAttributeCommand.js";
import { UserError } from "../../shared/UserError.js";
import { ArgumentCheck } from "./ArgumentCheck.js";
import type { CommandContext, CommandHandler } from "./CommandContext.js";

export class SetCommandHandler implements CommandHandler {
  public execute(args: readonly string[], context: CommandContext): CommandResult {
    if (args.length !== 3) {
      throw new UserError('usage: set <id> <attr> <value> (quote values containing spaces)');
    }
    ArgumentCheck.exact(args, 3, "set <id> <attr> <value>");
    context.session.requireDocument();
    return context.session.executeEdit(
      new SetAttributeCommand(
        args[0] ?? "",
        args[1] ?? "",
        args[2] ?? "",
        (document, shape, attribute, value) =>
          context.attributes.apply(document, shape, attribute, value)
      )
    );
  }
}
