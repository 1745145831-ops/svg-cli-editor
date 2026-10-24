import { UserError } from "../shared/UserError.js";

/**
 * Splits a command line into tokens. Double quotes group whitespace and only
 * \" and \\ are treated as escapes, so Windows paths in quotes stay intact.
 */
export class LineTokenizer {
  public tokenize(line: string): string[] {
    const tokens: string[] = [];
    let index = 0;
    while (index < line.length) {
      while (index < line.length && /\s/u.test(line[index] ?? "")) {
        index += 1;
      }
      if (index >= line.length) {
        break;
      }

      let token = "";
      let inQuote = false;
      let started = false;
      while (index < line.length) {
        const character = line[index] ?? "";
        if (inQuote) {
          if (character === '"') {
            inQuote = false;
            index += 1;
            continue;
          }
          if (character === "\\") {
            const next = line[index + 1];
            if (next === '"' || next === "\\") {
              token += next;
              index += 2;
              continue;
            }
          }
          token += character;
          index += 1;
          continue;
        }

        if (/\s/u.test(character)) {
          break;
        }
        if (character === '"') {
          inQuote = true;
          started = true;
          index += 1;
          continue;
        }
        token += character;
        started = true;
        index += 1;
      }

      if (inQuote) {
        throw new UserError("unterminated quote");
      }
      if (started) {
        tokens.push(token);
      }
    }
    return tokens;
  }
}
