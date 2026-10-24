import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommandHarness } from "../helpers/CommandHarness.js";

describe("session history and I/O barriers", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  it("requires a document for commands other than init/read/help", () => {
    expect(harness.run("tree").error).toBe(
      "no document. use 'init' or 'read' first"
    );
    expect(harness.run("create rect r1 0 0 1 1").error).toBe(
      "no document. use 'init' or 'read' first"
    );
    expect(harness.run("canvas").error).toBe(
      "no document. use 'init' or 'read' first"
    );
    expect(harness.run("undo").error).toBe(
      "no document. use 'init' or 'read' first"
    );
    expect(harness.run("help").error).toBeUndefined();
  });

  it("uses 800x600 by default and reports canvas dimensions", () => {
    expect(harness.success("init").message).toBe("canvas 800x600 created");
    expect(harness.success("canvas").message).toBe("canvas 800x600");
    expect(harness.success("init 1024").message).toBe("canvas 1024x600 created");
    expect(harness.success("canvas 1200").message).toBe("canvas resized to 1200x600");
    expect(harness.success("canvas").message).toBe("canvas 1200x600");
  });

  it("blocks undo after init until the next edit, then allows undo/redo", () => {
    harness.success("init 400 300");
    expect(harness.run("undo").error).toBe("undo not allowed after io command");
    expect(harness.run("redo").error).toBe("undo not allowed after io command");

    harness.success("create rect r1 0 0 10 10");
    expect(harness.success("undo").message).toBe("rect#r1 removed");
    expect(harness.success("redo").message).toBe("rect#r1 created");
  });

  it("clears the redo stack after a new edit", () => {
    harness.success("init");
    harness.success("create rect r1 0 0 10 10");
    harness.success("undo");
    harness.success("create circle c1 5 5 2");
    expect(harness.run("redo").error).toBe("nothing to redo");
  });

  it("reports exhausted undo and redo stacks", () => {
    harness.success("init");
    harness.success("create rect r1 0 0 10 10");
    harness.success("undo");
    expect(harness.run("undo").error).toBe("nothing to undo");
    harness.success("redo");
    expect(harness.run("redo").error).toBe("nothing to redo");
  });

  it("starts a new undo epoch after a successful save", () => {
    harness.success("init 400 300");
    harness.success("create rect r1 0 0 10 10");
    const filePath = harness.path("saved.svg");
    expect(harness.success(`save "${filePath}"`).message).toBe(
      `saved to ${filePath} (1 elements)`
    );
    expect(harness.run("undo").error).toBe("undo not allowed after io command");
    harness.success("create circle c1 5 5 2");
    expect(harness.success("undo").message).toBe("circle#c1 removed");
  });

  it("starts a new undo epoch after read and after canvas resize", () => {
    harness.success("init 400 300");
    harness.success("create rect r1 0 0 10 10");
    const filePath = harness.path("input.svg");
    harness.success(`save "${filePath}"`);
    harness.success(`read "${filePath}"`);
    expect(harness.run("undo").error).toBe("undo not allowed after io command");

    harness.success("canvas 500 400");
    expect(harness.run("undo").error).toBe("undo not allowed after io command");
    harness.success("create circle c1 5 5 2");
    expect(harness.success("undo").message).toBe("circle#c1 removed");
  });

  it("does not change history or document when save fails", () => {
    harness.success("init 400 300");
    harness.success("create rect r1 0 0 10 10");
    const missingDirectory = harness.path("missing-dir/none.svg");
    expect(harness.run(`save "${missingDirectory}"`).error).toBe(
      `cannot write file: ${missingDirectory}`
    );
    expect(harness.success("undo").message).toBe("rect#r1 removed");
  });

  it("does not replace the document when read fails", () => {
    harness.success("init 400 300");
    harness.success("create rect r1 0 0 10 10");
    expect(harness.run('read "does-not-exist.svg"').error).toBe(
      "cannot read file: does-not-exist.svg"
    );
    expect(harness.session.requireDocument().find("r1")).toBeDefined();
    expect(harness.success("undo").message).toBe("rect#r1 removed");
  });

  it("saves to the read path when save has no argument", () => {
    harness.success("init 400 300");
    harness.success("create rect r1 0 0 10 10");
    const filePath = harness.path("default.svg");
    harness.success(`save "${filePath}"`);
    harness.success(`read "${filePath}"`);
    expect(harness.success("save").message).toBe(
      `saved to ${filePath} (1 elements)`
    );
  });

  it("ignores comments and blank lines without changing the undo stack", () => {
    harness.success("init");
    harness.success("create rect r1 0 0 10 10");
    expect(harness.run("# comment")).toEqual({
      message: "",
      warnings: [],
      exit: false
    });
    expect(harness.run("   ")).toEqual({ message: "", warnings: [], exit: false });
    expect(harness.success("undo").message).toBe("rect#r1 removed");
  });

  it("marks quit as an exit request", () => {
    expect(harness.success("quit").exit).toBe(true);
  });
});
