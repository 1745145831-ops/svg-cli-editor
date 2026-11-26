import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GroupShape } from "../../src/domain/model/GroupShape.js";
import { RectShape } from "../../src/domain/model/RectShape.js";
import type { Plugin } from "../../src/kernel/plugin/Plugin.js";
import { PluginRuntime } from "../../src/kernel/plugin/PluginRuntime.js";
import { BoxShape } from "../../src/plugins/shape-box/BoxShape.js";
import boxPlugin from "../../src/plugins/shape-box/index.js";
import statsPlugin from "../../src/plugins/stats/index.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

function boxOf(harness: CommandHarness): BoxShape {
  const shape = harness.session.requireDocument().find("n1");
  if (!(shape instanceof BoxShape)) {
    throw new Error("n1 is not a BoxShape");
  }
  return shape;
}

describe("box shape plugin", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
    harness.activate(boxPlugin);
    harness.success("init 800 600");
  });

  afterEach(() => {
    harness.dispose();
  });

  it("activates independently through the kernel runtime", () => {
    const runtime = new PluginRuntime();
    runtime.activate(boxPlugin);
    expect(runtime.shapes.findByType("box")?.isContainer).toBe(true);
    expect(runtime.attributes.all().map((handler) => handler.name)).toEqual([
      "box-attributes"
    ]);
    expect(runtime.decorators.all().map((decorator) => decorator.name)).toEqual([
      "box-type-label"
    ]);
  });

  it("creates the required rect/text pair and exposes box-level attributes", () => {
    expect(harness.success('create box n1 120 100 160 60 "Start"').message).toBe(
      "g#n1 created"
    );
    const box = boxOf(harness);
    expect(box.children.map((child) => child.id)).toEqual(["n1-rect", "n1-label"]);
    expect(box.getAttributeValue("label")).toBe("Start");
    expect(harness.success("tree").message).toContain("g#n1 (box)");

    harness.success("set n1 fill #f5a623");
    harness.success('set n1 label "Go"');
    expect(box.getAttributeValue("fill")).toBe("#f5a623");
    expect(box.getAttributeValue("label")).toBe("Go");
    expect(box.children[0]?.getAttributeValue("fill")).toBe("#f5a623");
  });

  it("makes one set command one undo unit across child parts", () => {
    harness.success('create box n1 120 100 160 60 "Start"');
    harness.success("set n1 fill red");
    harness.success('set n1 label "Go"');
    const depth = harness.session.history.undoDepth;

    harness.success("undo");
    expect(boxOf(harness).getAttributeValue("label")).toBe("Start");
    harness.success("undo");
    expect(boxOf(harness).getAttributeValue("fill")).toBeUndefined();
    harness.success("redo");
    expect(boxOf(harness).getAttributeValue("fill")).toBe("red");
    harness.success("redo");
    expect(boxOf(harness).getAttributeValue("label")).toBe("Go");
    expect(harness.session.history.undoDepth).toBe(depth);
  });

  it("treats a literal label 'in' as content, not as a container clause", () => {
    expect(harness.success('create box n1 10 10 80 40 "in"').message).toBe("g#n1 created");
    expect(boxOf(harness).getAttributeValue("label")).toBe("in");
  });

  it("supports nesting, in-clauses, whole-box move/scale and refuses ungroup", () => {
    harness.success("create g outer");
    harness.success('create box n1 120 100 160 60 "Start" in outer');
    harness.success("move n1 10 20");
    expect(boxOf(harness).children.map((child) => child.geometryEntries)).toEqual([
      [
        ["x", 130],
        ["y", 120],
        ["width", 160],
        ["height", 60]
      ],
      [
        ["x", 150],
        ["y", 155]
      ]
    ]);
    harness.success("scale n1 2");
    expect(boxOf(harness).children[0]?.geometryEntries).toEqual([
      ["x", 260],
      ["y", 240],
      ["width", 320],
      ["height", 120]
    ]);
    expect(harness.run("ungroup n1").error).toBe("cannot ungroup container: n1");
  });

  it("rejects direct deletion or movement of required parts", () => {
    harness.success('create box n1 10 10 100 50 "x"');
    harness.success("create g other");
    expect(harness.run("delete n1-rect").error).toBe(
      "cannot modify required structural child: n1-rect"
    );
    expect(harness.run("addto other n1-label").error).toBe(
      "cannot modify required structural child: n1-label"
    );
    expect(harness.run("group both n1-rect n1-label").error).toBe(
      "cannot modify required structural child: n1-rect"
    );
    expect(boxOf(harness).children).toHaveLength(2);
  });

  it("fails atomically when a derived child id already exists", () => {
    harness.success("create rect n1-rect 0 0 10 10");
    const depth = harness.session.history.undoDepth;
    expect(harness.run('create box n1 20 20 30 30 "x"').error).toBe(
      "id already exists: n1-rect"
    );
    expect(harness.session.requireDocument().find("n1")).toBeUndefined();
    expect(harness.session.history.undoDepth).toBe(depth);
  });

  it("round-trips data-kind=box and degrades to a group without the plugin", () => {
    harness.success('create box n1 120 100 160 60 "Start"');
    harness.success("set n1 fill red");
    const filePath = harness.path("box.svg");
    harness.success(`save "${filePath}"`);
    const saved = readFileSync(filePath, "utf8");
    expect(saved).toContain('<g id="n1" data-kind="box">');
    expect(saved).toContain('<rect id="n1-rect"');

    harness.success(`read "${filePath}"`);
    expect(boxOf(harness).getAttributeValue("fill")).toBe("red");
    expect(harness.success("tree").message).toContain("(box)");

    const bare = new CommandHarness();
    try {
      bare.success(`read "${filePath}"`);
      const degraded = bare.session.requireDocument().find("n1");
      expect(degraded).toBeInstanceOf(GroupShape);
      expect(degraded).not.toBeInstanceOf(BoxShape);
      expect(degraded?.getExtraAttributeValue("data-kind")).toBe("box");
    } finally {
      bare.dispose();
    }
  });

  it("rejects malformed box reads without replacing the current document", () => {
    const missingLabel = harness.writeFile(
      "missing-label.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g id="n1" data-kind="box"><rect id="n1-rect" x="0" y="0" width="1" height="1"/></g></svg>'
    );
    harness.success("create rect keep 0 0 10 10");
    const outcome = harness.run(`read "${missingLabel}"`);
    expect(outcome.error?.startsWith("cannot parse SVG: invalid box")).toBe(true);
    expect(harness.session.requireDocument().find("keep")).toBeDefined();

    const wrongIds = harness.writeFile(
      "wrong-ids.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g id="n1" data-kind="box"><rect id="a" x="0" y="0" width="1" height="1"/><text id="b">x</text></g></svg>'
    );
    expect(harness.run(`read "${wrongIds}"`).error).toContain(
      "cannot parse SVG: invalid box"
    );
    expect(harness.session.requireDocument().find("keep")).toBeDefined();
  });

  it("rolls back a handler that throws after a partial child mutation", () => {
    harness.success('create box n1 120 100 160 60 "Start"');
    harness.success("set n1 fill red");
    const depth = harness.session.history.undoDepth;
    const failing: Plugin = {
      manifest: {
        name: "@test/failing-attribute",
        contributes: { attributes: ["failing"] }
      },
      activate(context) {
        context.registerAttributeHandler({
          name: "failing",
          priority: 200,
          handles: () => true,
          apply: (request) => {
            if (request.shape instanceof BoxShape) {
              request.shape.setFill("blue");
            }
            throw new Error("handler exploded");
          }
        });
      }
    };
    harness.activate(failing);

    expect(harness.run("set n1 fill green").error).toBe("internal: handler exploded");
    expect(boxOf(harness).getAttributeValue("fill")).toBe("red");
    expect(harness.session.history.undoDepth).toBe(depth);
  });

  it("rejects equal-priority handler conflicts before mutation", () => {
    harness.success('create box n1 120 100 160 60 "Start"');
    harness.success("set n1 fill red");
    const depth = harness.session.history.undoDepth;
    const conflicting: Plugin = {
      manifest: {
        name: "@test/conflicting-attribute",
        contributes: { attributes: ["other-box-fill"] }
      },
      activate(context) {
        context.registerAttributeHandler({
          name: "other-box-fill",
          priority: 100,
          handles: (request) =>
            request.shape instanceof BoxShape && request.attribute === "fill",
          apply: () => {
            throw new Error("should not run");
          }
        });
      }
    };
    harness.activate(conflicting);
    expect(harness.run("set n1 fill green").error).toContain(
      "ambiguous attribute handlers for n1/fill"
    );
    expect(boxOf(harness).getAttributeValue("fill")).toBe("red");
    expect(harness.session.history.undoDepth).toBe(depth);
  });

  it("is counted as a container by stats while its parts are leaves", () => {
    harness.activate(statsPlugin);
    harness.success('create box n1 120 100 160 60 "Start"');
    expect(harness.success("stats").message).toBe(
      "rect: 1  text: 1  (total 2, containers 1)"
    );
  });

  it("keeps a box type when a memento is restored", () => {
    harness.success('create box n1 120 100 160 60 "Start"');
    harness.success("set n1 fill red");
    harness.success("undo");
    expect(boxOf(harness)).toBeInstanceOf(BoxShape);
    expect(boxOf(harness).children[0]).toBeInstanceOf(RectShape);
  });
});
