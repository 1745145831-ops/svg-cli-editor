import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { Command } from "../../kernel/plugin/Command.js";
import type { CommandContext } from "../../kernel/context/CommandContext.js";
import type { CommandHandler } from "../../application/handlers/CommandContext.js";

/** Adapts a Phase 1 handler to the Command extension point with help metadata. */
export class RegisteredCommand implements Command {
  public constructor(
    public readonly name: string,
    private readonly handler: CommandHandler,
    public readonly usage: string,
    public readonly summary: string,
    public readonly aliases: readonly string[] = []
  ) {}

  public execute(args: readonly string[], context: CommandContext): CommandResult {
    return this.handler.execute(args, context);
  }
}
