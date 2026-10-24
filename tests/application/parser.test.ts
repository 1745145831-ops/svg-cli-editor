import { describe, expect, it } from "vitest";
import { CommandParser } from "../../src/application/CommandParser.js";
import { LineTokenizer } from "../../src/application/LineTokenizer.js";
import { UserError } from "../../src/shared/UserError.js";

describe("LineTokenizer", () => {
  const tokenizer = new LineTokenizer();

  it("splits plain arguments and preserves # inside values", () => {
    expect(tokenizer.tokenize("create rect bg 0 0 10 10 #ffffff")).toEqual([
      "create",
      "rect",
      "bg",
      "0",
      "0",
      "10",
      "10",
      "#ffffff"
    ]);
  });

  it("groups double-quoted whitespace and supports escaped quotes", () => {
    expect(tokenizer.tokenize('set t1 text "hello \\"world\\""')).toEqual([
      "set",
      "t1",
      "text",
      'hello "world"'
    ]);
    expect(tokenizer.tokenize('create text t 0 0 ""')).toEqual([
      "create",
      "text",
      "t",
      "0",
      "0",
      ""
    ]);
  });

  it("preserves Windows path backslashes inside quotes", () => {
    expect(tokenizer.tokenize('save "C:\\work\\demo.svg"')).toEqual([
      "save",
      "C:\\work\\demo.svg"
    ]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => tokenizer.tokenize('create text t 0 0 "broken')).toThrow(UserError);
  });
});

describe("CommandParser", () => {
  const parser = new CommandParser();

  it("returns null for blank lines and comments", () => {
    expect(parser.parse("")).toBeNull();
    expect(parser.parse("   ")).toBeNull();
    expect(parser.parse("  # a comment")).toBeNull();
  });

  it("separates the command name from its arguments", () => {
    expect(parser.parse('create text t 10 20 "hello world"')).toEqual({
      name: "create",
      args: ["text", "t", "10", "20", "hello world"]
    });
  });
});
