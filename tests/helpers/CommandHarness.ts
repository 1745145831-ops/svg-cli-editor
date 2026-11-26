import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommandDispatcher } from "../../src/application/CommandDispatcher.js";
import { CommandParser } from "../../src/application/CommandParser.js";
import type { CommandContext } from "../../src/kernel/context/CommandContext.js";
import type { Plugin } from "../../src/kernel/plugin/Plugin.js";
import { PluginHost } from "../../src/host/PluginHost.js";
import { UserError } from "../../src/shared/UserError.js";

export interface CommandOutcome {
  readonly message: string;
  readonly warnings: readonly string[];
  readonly error?: string;
  readonly exit: boolean;
}

/**
 * In-process CLI harness. The default host has only the built-ins, so Phase 1
 * compatibility tests stay independent of optional plugins.
 */
export class CommandHarness {
  public readonly directory: string;
  public readonly host: PluginHost;
  public readonly dispatcher: CommandDispatcher;
  public readonly parser = new CommandParser();
  public readonly context: CommandContext;

  public constructor() {
    this.directory = mkdtempSync(join(tmpdir(), "svg-editor-test-"));
    this.host = new PluginHost(this.directory);
    this.dispatcher = this.host.dispatcher;
    this.context = this.host.context;
  }

  public get session() {
    return this.host.session;
  }

  public activate(plugin: Plugin): void {
    this.host.activate(plugin);
  }

  public run(line: string): CommandOutcome {
    try {
      const command = this.parser.parse(line);
      if (command === null) {
        return { message: "", warnings: [], exit: false };
      }
      const result = this.dispatcher.dispatch(command, this.context);
      return {
        message: result.message,
        warnings: result.warnings ?? [],
        exit: result.exit === true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        message: "",
        warnings: [],
        error: error instanceof UserError ? message : `internal: ${message}`,
        exit: false
      };
    }
  }

  public success(line: string): CommandOutcome {
    const outcome = this.run(line);
    if (outcome.error !== undefined) {
      throw new Error(`command failed: ${line}\n${outcome.error}`);
    }
    return outcome;
  }

  public path(name: string): string {
    return join(this.directory, name);
  }

  public writeFile(name: string, content: string): string {
    const filePath = this.path(name);
    writeFileSync(filePath, content, "utf8");
    return filePath;
  }

  public readFile(name: string): string {
    return readFileSync(this.path(name), "utf8");
  }

  public dispose(): void {
    rmSync(this.directory, { recursive: true, force: true });
  }
}
