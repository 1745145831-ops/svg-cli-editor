import type { CommandResult } from "../domain/command/CommandResult.js";
import type { CommandContext } from "../kernel/context/CommandContext.js";
import { CommandRegistry } from "../kernel/plugin/CommandRegistry.js";
import type { ParsedCommand } from "./ParsedCommand.js";

/**
 * Adapter kept for the CLI layer. Commands themselves live in a registry and
 * are contributed by plugins; this class only performs name lookup.
 */
export class CommandDispatcher {
  public constructor(private readonly registry: CommandRegistry = new CommandRegistry()) {}

  public dispatch(command: ParsedCommand, context: CommandContext): CommandResult {
    return this.registry.execute(command.name, command.args, context);
  }
}
