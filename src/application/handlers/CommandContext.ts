import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { CommandContext } from "../../kernel/context/CommandContext.js";

export type { CommandContext };

/**
 * Legacy handler signature retained for the built-in command plugin. The
 * plugin-facing extension point is kernel/plugin/Command.
 */
export interface CommandHandler {
  execute(args: readonly string[], context: CommandContext): CommandResult;
}
