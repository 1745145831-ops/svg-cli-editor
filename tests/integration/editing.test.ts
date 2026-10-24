import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GroupShape } from "../../src/domain/model/GroupShape.js";
import type { SvgDocument } from "../../src/domain/model/SvgDocument.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

function documentOf(harness: CommandHarness): SvgDocument {
  return harness.session.requireDocument();
}

describe("editing commands", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
    harness.success("init 800 600");
  });

  afterEach(() => {
    harness.dispose();
  });

  it("creates shapes in nested containers with the in clause", () => {
    expect(harness.success("create g node1").message).toBe("g#node1 created");
    expect(
      harness.success("create rect start 120 100 160 60 #4a90d9 in node1").message
    ).toBe("rect#start created in g#node1");
    expect(
      harness.success('create text start-label 155 135 "开始" in node1').message
    ).toBe("text#start-label created in g#node1");

    const tree = harness.success("tree").message;
    expect(tree).toContain("svg (800x600)");
    expect(tree).toContain("g#node1");
    expect(tree).toContain("rect#start");
    expect(tree).toContain("text#start-label");
    expect(tree).toContain('"开始"');
  });

  it("creates every built-in shape type with optional presentation values", () => {
    harness.success("create g scene");
    expect(
      harness.success("create ellipse e1 40 30 20 10 #abcdef in scene").message
    ).toBe("ellipse#e1 created in g#scene");
    expect(
      harness.success("create line l1 0 0 80 0 black in scene").message
    ).toBe("line#l1 created in g#scene");
    expect(
      harness.success('create text t1 10 20 "in" in scene').message
    ).toBe("text#t1 created in g#scene");
    expect(harness.success("create circle c1 5 5 2 in scene").message).toBe(
      "circle#c1 created in g#scene"
    );
    expect(harness.success("create rect r1 0 0 10 10 in scene").message).toBe(
      "rect#r1 created in g#scene"
    );

    const document = documentOf(harness);
    expect(document.find("e1")?.getAttributeValue("fill")).toBe("#abcdef");
    expect(document.find("l1")?.getAttributeValue("stroke")).toBe("black");
    expect(document.find("t1")?.getAttributeValue("text")).toBe("in");
    expect(document.find("r1")?.getAttributeValue("fill")).toBeUndefined();
    expect(harness.success("show c1").message).toBe(
      "circle#c1  parent=g#scene\n  cx=5 cy=5 r=2"
    );
  });

  it("groups selected shapes in their existing document order", () => {
    harness.success("create rect a 0 0 10 10");
    harness.success("create rect b 20 0 10 10");
    harness.success("create rect c 40 0 10 10");
    harness.success("group g c a");

    const document = documentOf(harness);
    expect(document.rootChildren.map((shape) => shape.id)).toEqual(["g", "b"]);
    expect((document.find("g") as GroupShape).children.map((shape) => shape.id)).toEqual([
      "a",
      "c"
    ]);
  });

  it("preserves inherited group state when ungrouping", () => {
    const filePath = harness.writeFile(
      "ungroup-transform.svg",
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <g id="outer">
          <g id="inner" transform="translate(100,50)" fill="red" stroke="blue" xmlns:foo="urn:example:foo">
            <rect id="r1" x="0" y="0" width="10" height="10"/>
            <circle id="c1" cx="5" cy="5" r="2" foo:bar="value"/>
          </g>
        </g>
      </svg>`
    );
    harness.success(`read "${filePath}"`);
    harness.success("ungroup inner");
    const document = documentOf(harness);
    expect(document.find("inner")).toBeUndefined();
    expect(document.find("r1")?.getAttributeValue("fill")).toBe("red");
    expect(document.find("r1")?.getAttributeValue("stroke")).toBe("blue");
    expect(document.find("r1")?.getExtraAttributeValue("transform")).toBe(
      "translate(100,50)"
    );
    expect(document.find("c1")?.getExtraAttributeValue("xmlns:foo")).toBe(
      "urn:example:foo"
    );
    expect(harness.success("show r1").message).toContain("transform=translate(100,50)");

    const savedPath = harness.path("ungroup-transform-out.svg");
    harness.success(`save "${savedPath}"`);
    expect(harness.run(`read "${savedPath}"`).error).toBeUndefined();
  });

  it("moves and scales groups by modifying descendants, then undoes exactly", () => {
    harness.success("create g node1");
    harness.success("create rect r1 10 20 30 40 red in node1");
    harness.success("create circle c1 5 6 2 in node1");

    expect(harness.success("move node1 5 7").message).toBe("g#node1 moved by (5,7)");
    expect(documentOf(harness).find("r1")?.geometryEntries).toEqual([
      ["x", 15],
      ["y", 27],
      ["width", 30],
      ["height", 40]
    ]);
    expect(harness.success("undo").message).toBe("g#node1 moved back by (-5,-7)");
    expect(documentOf(harness).find("r1")?.geometryEntries).toEqual([
      ["x", 10],
      ["y", 20],
      ["width", 30],
      ["height", 40]
    ]);

    harness.success("scale node1 2");
    expect(documentOf(harness).find("c1")?.geometryEntries).toEqual([
      ["cx", 10],
      ["cy", 12],
      ["r", 4]
    ]);
    harness.success("undo");
    expect(documentOf(harness).find("c1")?.geometryEntries).toEqual([
      ["cx", 5],
      ["cy", 6],
      ["r", 2]
    ]);
  });

  it("groups existing shapes at the first selected position and keeps order", () => {
    harness.success("create rect a 0 0 10 10");
    harness.success("create rect b 20 0 10 10");
    harness.success("create rect c 40 0 10 10");
    harness.success("create rect d 60 0 10 10");

    expect(harness.success("group g1 b d").message).toBe(
      "g#g1 created with 2 children"
    );
    const document = documentOf(harness);
    const labels = document.rootChildren.map((shape) => shape.id);
    expect(labels).toEqual(["a", "g1", "c"]);
    const group = document.find("g1");
    expect(group).toBeInstanceOf(GroupShape);
    expect((group as GroupShape).children.map((shape) => shape.id)).toEqual(["b", "d"]);

    harness.success("undo");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "a",
      "b",
      "c",
      "d"
    ]);
    harness.success("redo");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "a",
      "g1",
      "c"
    ]);
  });

  it("ungroups a nested container in place and restores it on undo", () => {
    harness.success("create g outer");
    harness.success("create g inner in outer");
    harness.success("create rect r1 10 10 20 20 red in inner");
    harness.success("create circle c1 5 5 3 in inner");
    harness.success("create rect r2 90 90 10 10 in outer");

    expect(harness.success("ungroup inner").message).toBe("g#inner ungrouped (2 children)");
    const outer = documentOf(harness).find("outer");
    expect(outer).toBeInstanceOf(GroupShape);
    expect((outer as GroupShape).children.map((shape) => shape.id)).toEqual([
      "r1",
      "c1",
      "r2"
    ]);

    harness.success("undo");
    const restoredOuter = documentOf(harness).find("outer") as GroupShape;
    expect(restoredOuter.children.map((shape) => shape.id)).toEqual(["inner", "r2"]);
    expect((restoredOuter.children[0] as GroupShape).children.map((shape) => shape.id)).toEqual([
      "r1",
      "c1"
    ]);
  });

  it("deletes a subtree as one undo unit and restores its parent", () => {
    harness.success("create g g1");
    harness.success("create rect r1 0 0 10 10 in g1");
    harness.success("create circle c1 5 5 2 in g1");

    expect(harness.success("delete g1").message).toBe("g#g1 deleted");
    expect(documentOf(harness).find("r1")).toBeUndefined();
    expect(documentOf(harness).find("c1")).toBeUndefined();

    expect(harness.success("undo").message).toBe("g#g1 restored to canvas");
    expect(documentOf(harness).find("r1")).toBeDefined();
    expect(documentOf(harness).find("c1")).toBeDefined();
    expect((documentOf(harness).find("r1") as { parent: GroupShape }).parent.id).toBe(
      "g1"
    );
  });

  it("sets geometry, presentation and text attributes", () => {
    harness.success("create rect r1 0 0 10 10");
    harness.success('create text t1 10 20 "old"');

    expect(harness.success("set r1 width 25").message).toBe("rect#r1 updated: width=25");
    expect(harness.success("set r1 fill red").message).toBe("rect#r1 updated: fill=red");
    expect(harness.success("set r1 stroke-width 2.5").message).toBe(
      "rect#r1 updated: stroke-width=2.5"
    );
    expect(harness.success('set t1 text "new label"').message).toBe(
      'text#t1 updated: text="new label"'
    );
    expect(documentOf(harness).find("r1")?.getAttributeValue("width")).toBe("25");
    expect(documentOf(harness).find("t1")?.getAttributeValue("text")).toBe("new label");

    expect(harness.success("undo").message).toBe(
      'text#t1 updated: text="old"'
    );
    expect(documentOf(harness).find("t1")?.getAttributeValue("text")).toBe("old");
  });

  it("adds an existing shape to a container, reorders it, and undoes", () => {
    harness.success("create g g1");
    harness.success("create rect r1 0 0 10 10");
    harness.success("create rect r2 20 0 10 10");

    expect(harness.success("addto g1 r1").message).toBe("rect#r1 moved into g#g1");
    expect((documentOf(harness).find("g1") as GroupShape).children[0]?.id).toBe("r1");
    expect(harness.success("undo").message).toBe("rect#r1 moved back to canvas");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "g1",
      "r1",
      "r2"
    ]);

    harness.success("front r2");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "g1",
      "r1",
      "r2"
    ]);
    harness.success("back r2");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "r2",
      "g1",
      "r1"
    ]);
    harness.success("undo");
    expect(documentOf(harness).rootChildren.map((shape) => shape.id)).toEqual([
      "g1",
      "r1",
      "r2"
    ]);
  });

  it("reports the specified errors and leaves history untouched", () => {
    harness.success("create g g1");
    harness.success("create rect r1 0 0 10 10 in g1");

    expect(harness.run("create rect r1 0 0 10 10").error).toBe(
      "id already exists: r1"
    );
    expect(harness.run("create box b1 0 0 10 10 \"x\"").error).toBe(
      "unknown shape type: box (is the plugin loaded?)"
    );
    expect(harness.run("create rect r2 0 0 10 10 in missing").error).toBe(
      "no such container: missing"
    );
    expect(harness.run("create rect r2 0 0 10 10 in r1").error).toBe(
      "not a container: r1"
    );
    expect(harness.run("group bad r1 g1").error).toBe(
      "cannot group a container into its own descendant: g1"
    );
    expect(harness.run("ungroup g1").error).toBe(
      "cannot ungroup top-level container: g1"
    );
    expect(harness.run("scale r1 0").error).toBe("scale factor must be positive");
    expect(harness.run("set r1 mystery 3").error).toBe("unknown attribute: mystery");
    expect(harness.run("move missing 1 1").error).toBe("no such shape: missing");

    // The last successful edit was creating r1; failed commands did not add
    // entries or change the shape tree.
    expect(documentOf(harness).find("r1")?.getAttributeValue("width")).toBe("10");
    harness.success("undo");
    expect(documentOf(harness).find("r1")).toBeUndefined();
  });
});
