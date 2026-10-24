import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommandHarness } from "../helpers/CommandHarness.js";

describe("tree, show and help", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
    harness.success("init 800 600");
    harness.success("create g scene");
    harness.success("create rect r1 10 20 30 40 #abc in scene");
    harness.success("create circle c1 5 6 2 in scene");
    harness.success("create rect outside 0 0 1 1");
  });

  afterEach(() => {
    harness.dispose();
  });

  it("shows the whole tree and a single subtree", () => {
    const tree = harness.success("tree").message;
    expect(tree).toContain("svg (800x600)");
    expect(tree).toContain("g#scene");
    expect(tree).toContain("rect#r1");
    expect(tree).toContain("circle#c1");
    expect(tree).toContain("rect#outside");

    const subtree = harness.success("tree scene").message;
    expect(subtree.startsWith("g#scene")).toBe(true);
    expect(subtree).toContain("rect#r1");
    expect(subtree).not.toContain("outside");
    expect(harness.run("tree missing").error).toBe("no such shape: missing");
  });

  it("shows details for containers, leaves and text", () => {
    expect(harness.success("show scene").message).toBe(
      "g#scene  parent=svg\n  children=2"
    );
    expect(harness.success("show r1").message).toBe(
      "rect#r1  parent=g#scene\n  x=10 y=20 width=30 height=40\n  fill=#abc"
    );
    harness.success('create text t1 2 3 "label"');
    expect(harness.success("show t1").message).toBe(
      'text#t1  parent=svg\n  x=2 y=3\n  text="label"'
    );
    expect(harness.run("show missing").error).toBe("no such shape: missing");
  });

  it("lists every top-level command in help", () => {
    const help = harness.success("help").message;
    for (const command of [
      "init",
      "read",
      "save",
      "canvas",
      "create",
      "delete",
      "move",
      "scale",
      "set",
      "group",
      "ungroup",
      "addto",
      "front",
      "back",
      "tree",
      "show",
      "undo",
      "redo",
      "help"
    ]) {
      expect(help).toContain(`${command}`);
    }
  });
});
