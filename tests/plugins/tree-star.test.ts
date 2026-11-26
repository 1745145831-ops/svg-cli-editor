import { afterEach, describe, expect, it } from "vitest";
import boxPlugin from "../../src/plugins/shape-box/index.js";
import treeStarPlugin from "../../src/plugins/tree-star/index.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

function lineWith(tree: string, needle: string): string {
  const line = tree.split("\n").find((candidate) => candidate.includes(needle));
  if (line === undefined) {
    throw new Error(`tree line not found: ${needle}\n${tree}`);
  }
  return line;
}

describe("modified-star tree decorator", () => {
  let harness: CommandHarness;

  const createHarness = (withBox = false): CommandHarness => {
    const next = new CommandHarness();
    if (withBox) {
      next.activate(boxPlugin);
    }
    next.activate(treeStarPlugin);
    return next;
  };

  afterEach(() => {
    harness?.dispose();
  });

  it("marks new and edited rows, then clears at the save point", () => {
    harness = createHarness();
    harness.success("init 800 600");
    expect(harness.success("tree").message).toBe("svg (800x600)");

    harness.success("create g outer");
    harness.success("create rect r1 10 10 20 20 in outer");
    let tree = harness.success("tree").message;
    expect(lineWith(tree, "svg (800x600)")).toContain("*");
    expect(lineWith(tree, "g#outer")).toContain("*");
    expect(lineWith(tree, "rect#r1")).toContain("*");

    const saved = harness.path("dirty.svg");
    harness.success(`save "${saved}"`);
    tree = harness.success("tree").message;
    expect(tree).not.toContain("*");
  });

  it("does not propagate a child edit to its ancestor, but the root stays dirty", () => {
    harness = createHarness();
    harness.success("init 800 600");
    harness.success("create g outer");
    harness.success("create rect r1 10 10 20 20 in outer");
    harness.success(`save "${harness.path("ancestor.svg")}"`);
    harness.success("set r1 fill red");

    const tree = harness.success("tree").message;
    expect(lineWith(tree, "svg (800x600)")).toContain("*");
    expect(lineWith(tree, "g#outer")).not.toContain("*");
    expect(lineWith(tree, "rect#r1")).toContain("*");
  });

  it("uses content-vs-save semantics: undo back to the save point clears the star", () => {
    harness = createHarness();
    harness.success("init 800 600");
    harness.success("create rect r1 10 10 20 20");
    const saved = harness.path("saved.svg");
    harness.success(`save "${saved}"`);
    expect(harness.success("tree").message).not.toContain("*");

    harness.success("set r1 fill red");
    expect(lineWith(harness.success("tree").message, "rect#r1")).toContain("*");
    harness.success("undo");
    expect(harness.success("tree").message).not.toContain("*");
    harness.success("redo");
    expect(lineWith(harness.success("tree").message, "rect#r1")).toContain("*");
  });

  it("marks a new node immediately and also after a failed save", () => {
    harness = createHarness();
    harness.success("init 800 600");
    const missing = harness.path("missing/child.svg");
    expect(harness.run(`save "${missing}"`).error).toContain("cannot write file");
    expect(harness.success("tree").message).not.toContain("*");

    harness.success("create circle c1 10 10 5");
    expect(lineWith(harness.success("tree").message, "circle#c1")).toContain("*");
  });

  it("coexists with (box) using registration order: (box) then star", () => {
    harness = createHarness(true);
    harness.success("init 800 600");
    harness.success('create box n1 120 100 160 60 "Start"');
    let tree = harness.success("tree").message;
    expect(lineWith(tree, "g#n1")).toContain("g#n1 (box) *");
    harness.success(`save "${harness.path("box-baseline.svg")}"`);
    expect(lineWith(harness.success("tree").message, "g#n1")).toBe("└── g#n1 (box)");

    harness.success("set n1 fill red");
    tree = harness.success("tree").message;
    expect(lineWith(tree, "g#n1")).not.toContain("*");
    expect(lineWith(tree, "g#n1")).toContain("(box)");
    expect(lineWith(tree, "rect#n1-rect")).toContain("*");

    harness.success(`save "${harness.path("box-clean.svg")}"`);
    tree = harness.success("tree").message;
    expect(lineWith(tree, "g#n1")).toBe("└── g#n1 (box)");
  });

  it("keeps state per decorator instance", () => {
    const one = createHarness();
    const two = createHarness();
    try {
      one.success("init 100 100");
      one.success("create rect r1 0 0 10 10");
      two.success("init 100 100");
      expect(one.success("tree").message).toContain("*");
      expect(two.success("tree").message).not.toContain("*");
    } finally {
      one.dispose();
      two.dispose();
    }
  });
});
