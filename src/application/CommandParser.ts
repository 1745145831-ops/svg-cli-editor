import { LineTokenizer } from "./LineTokenizer.js";
import type { ParsedCommand } from "./ParsedCommand.js";

/** Parses one REPL line; blank lines and # comments return null. */
export class CommandParser {
  public constructor(private readonly tokenizer = new LineTokenizer()) {}

  public parse(line: string): ParsedCommand | null {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      return null;
    }
    const tokens = this.tokenizer.tokenize(line);
    const name = tokens[0];
    if (name === undefined) {
      return null;
    }
    return { name, args: tokens.slice(1) };
  }
}
