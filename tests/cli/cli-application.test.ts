import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CliApplication } from "../../src/cli/CliApplication.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

describe("CliApplication", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  it("prints the banner, prompts, command output and formatted errors", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    output.on("data", (chunk: Buffer | string) => {
      text += chunk.toString();
    });
    const application = new CliApplication(
      input,
      output,
      harness.dispatcher,
      harness.parser,
      harness.context
    );

    const running = application.run();
    input.end(
      [
        "init 800 600",
        'create text t1 10 20 "hello world"',
        "# ignored comment",
        "bogus",
        "quit",
        "create rect ignored 0 0 1 1",
        ""
      ].join("\n")
    );
    await running;

    expect(text).toContain("svg-editor 0.1 — type 'help' for commands");
    expect(text).toContain("svg> ");
    expect(text).toContain("canvas 800x600 created");
    expect(text).toContain('text#t1 created');
    expect(text).toContain("error: unknown command: bogus (type 'help')");
    expect(text).not.toContain("rect#ignored");
  });

  it("formats parse and domain errors without crashing", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let text = "";
    output.on("data", (chunk: Buffer | string) => {
      text += chunk.toString();
    });
    const application = new CliApplication(
      input,
      output,
      harness.dispatcher,
      harness.parser,
      harness.context
    );

    const running = application.run();
    input.end('create text broken 0 0 "unterminated\n');
    await running;

    expect(text).toContain("error: unterminated quote");
  });
});
