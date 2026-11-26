import { afterEach, beforeEach, describe, expect, it } from "vitest";
import statsPlugin from "../../src/plugins/stats/index.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

describe("stats command plugin", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  it("counts leaves in first-appearance order and excludes the root", () => {
    harness.success("init 800 600");
    harness.success("create g outer");
    harness.success("create rect r1 0 0 10 10 in outer");
    harness.success("create circle c1 10 10 3 in outer");
    harness.success("create g inner in outer");
    harness.success("create text t1 1 2 \"x\" in inner");
    harness.success("create rect r2 20 20 5 5");

    harness.activate(statsPlugin);
    expect(harness.success("stats").message).toBe(
      "rect: 2  circle: 1  text: 1  (total 4, containers 2)"
    );
  });

  it("reports the empty-canvas form and does not enter undo history", () => {
    harness.success("init 100 100");
    harness.activate(statsPlugin);
    expect(harness.success("stats").message).toBe("(total 0, containers 0)");

    harness.success("create rect r1 0 0 10 10");
    harness.success("stats");
    expect(harness.session.history.undoDepth).toBe(1);
    harness.success("undo");
    expect(harness.session.requireDocument().find("r1")).toBeUndefined();
  });

  it("requires a document and appears in help when installed", () => {
    harness.activate(statsPlugin);
    expect(harness.run("stats").error).toBe(
      "no document. use 'init' or 'read' first"
    );
    harness.success("init");
    const helpLine = harness
      .success("help")
      .message.split("\n")
      .find((line) => line.includes("stats") && line.includes("show leaf counts"));
    expect(helpLine).toBeDefined();
  });

  it("is an unknown command when the plugin is not installed", () => {
    harness.success("init");
    expect(harness.run("stats").error).toBe("unknown command: stats (type 'help')");
  });
});
