import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { Command } from "../../kernel/plugin/Command.js";
import type { CommandContext } from "../../kernel/context/CommandContext.js";
import type { DirectoryEntry } from "../../kernel/ports/DirectoryAccess.js";
import { UserError } from "../../shared/UserError.js";

const COLLATOR = (left: DirectoryEntry, right: DirectoryEntry): number =>
  left.name < right.name ? -1 : left.name > right.name ? 1 : 0;

/** `dir` command plugin: formatting only, all filesystem access is behind the port. */
export class DirCommand implements Command {
  public readonly name = "dir";
  public readonly usage = "dir";
  public readonly summary = "list files and directories in the current directory";
  public readonly helpGroup = "plugin" as const;

  public execute(args: readonly string[], context: CommandContext): CommandResult {
    if (args.length !== 0) {
      throw new UserError("usage: dir");
    }
    let entries: readonly DirectoryEntry[];
    try {
      entries = context.directory.list(context.cwd);
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError(`cannot read directory: ${context.cwd}`);
    }

    const directories = entries
      .filter((entry) => entry.kind === "directory")
      .sort(COLLATOR)
      .map((entry) => `[DIR]  ${entry.name}`);
    const files = entries
      .filter((entry) => entry.kind === "file")
      .sort(COLLATOR)
      .map((entry) => `[FILE]  ${entry.name}`);
    const others = entries
      .filter((entry) => entry.kind === "other")
      .sort(COLLATOR)
      .map((entry) => `[OTHER]  ${entry.name}`);
    const lines = [...directories, ...files, ...others];
    return { message: lines.length === 0 ? "(empty directory)" : lines.join("\n") };
  }
}
