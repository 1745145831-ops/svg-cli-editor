import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { CommandContext } from "../application/handlers/CommandContext.js";
import type { CommandDispatcher } from "../application/CommandDispatcher.js";
import type { CommandParser } from "../application/CommandParser.js";
import { UserError } from "../shared/UserError.js";

/**
 * Thin terminal adapter. It owns the prompt and the `error:`/`warning:`
 * formatting but knows nothing about SVG or command semantics.
 */
export class CliApplication {
  public constructor(
    private readonly input: Readable,
    private readonly output: Writable,
    private readonly dispatcher: CommandDispatcher,
    private readonly parser: CommandParser,
    private readonly context: CommandContext,
    private readonly version = "0.1"
  ) {}

  public async run(): Promise<void> {
    this.write(`svg-editor ${this.version} — type 'help' for commands\n\n`);
    const readline = createInterface({
      input: this.input,
      output: this.output,
      terminal: (this.input as Readable & { isTTY?: boolean }).isTTY === true,
      crlfDelay: Infinity
    });

    this.write("svg> ");
    for await (const line of readline) {
      const shouldExit = this.handleLine(line);
      if (shouldExit) {
        break;
      }
      this.write("svg> ");
    }
    this.write("\n");
    readline.close();
  }

  private handleLine(line: string): boolean {
    try {
      const command = this.parser.parse(line);
      if (command === null) {
        return false;
      }
      const result = this.dispatcher.dispatch(command, this.context);
      for (const warning of result.warnings ?? []) {
        this.write(`warning: ${this.singleLine(warning)}\n`);
      }
      if (result.message.length > 0) {
        this.write(`${result.message}\n`);
      }
      return result.exit === true;
    } catch (error) {
      if (error instanceof UserError) {
        this.write(`error: ${this.singleLine(error.message)}\n`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        this.write(`error: internal error: ${this.singleLine(message)}\n`);
      }
      return false;
    }
  }

  private singleLine(text: string): string {
    return text.replace(/\s*\r?\n\s*/gu, " ");
  }

  private write(text: string): void {
    this.output.write(text);
  }
}
