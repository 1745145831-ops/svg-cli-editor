import type { CommandResult } from "../../domain/command/CommandResult.js";
import { UserError } from "../../shared/UserError.js";
import type { CommandContext } from "../context/CommandContext.js";
import type { Command } from "./Command.js";
import { PluginError } from "./PluginError.js";

/** Registry and dispatcher for the Command extension point. */
export class CommandRegistry {
  private readonly commands = new Map<string, Command>();
  private readonly aliases = new Map<string, string>();

  public register(command: Command): void {
    this.assertAvailable(command);
    this.commands.set(command.name, command);
    for (const alias of command.aliases ?? []) {
      this.aliases.set(alias, command.name);
    }
  }

  public assertAvailable(command: Command): void {
    if (this.commands.has(command.name)) {
      throw new PluginError(
        "duplicate-registration",
        `duplicate registration: commands/${command.name}`
      );
    }
    for (const alias of command.aliases ?? []) {
      if (
        this.commands.has(alias) ||
        this.aliases.has(alias) ||
        (command.aliases ?? []).filter((candidate) => candidate === alias).length > 1
      ) {
        throw new PluginError(
          "duplicate-registration",
          `duplicate registration: commands/${alias}`
        );
      }
    }
  }

  public execute(name: string, args: readonly string[], context: CommandContext): CommandResult {
    const command = this.find(name);
    if (command === undefined) {
      throw new UserError(`unknown command: ${name} (type 'help')`);
    }
    return command.execute(args, context);
  }

  public find(name: string): Command | undefined {
    const canonical = this.aliases.get(name) ?? name;
    return this.commands.get(canonical);
  }

  public all(): readonly Command[] {
    return [...this.commands.values()];
  }

  public pluginCommands(): readonly Command[] {
    return this.all().filter((command) => command.helpGroup === "plugin");
  }
}
