import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { CommandContext } from "../context/CommandContext.js";

/** Extension point for one REPL command. */
export interface Command {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly usage: string;
  readonly summary: string;
  /** Plugin commands are discovered for the `help` plugin section. */
  readonly helpGroup?: "plugin";
  execute(args: readonly string[], context: CommandContext): CommandResult;
}
