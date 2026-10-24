import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommandHarness } from "../helpers/CommandHarness.js";

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

describe("SVG import/export", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  it("assigns ids in document order and reports the required warning", () => {
    const filePath = harness.writeFile("other.svg", SAMPLE_SVG);
    const outcome = harness.success(`read "${filePath}"`);
    expect(outcome.warnings).toEqual([
      "assigned id rect1 to unnamed <rect>"
    ]);
    expect(outcome.message).toBe(`read ${filePath} (7 elements)`);
    const document = harness.session.requireDocument();
    expect(document.width).toBe(400);
    expect(document.height).toBe(300);
    expect(document.rootChildren[0]?.id).toBe("rect1");
    expect(document.rootChildren[1]?.id).toBe("t1");
    expect(document.rootChildren[4]?.id).toBe("e1");
    const tree = harness.success("tree").message;
    expect(tree).toContain("rect#rect1");
    expect(tree).toContain("circle#c2");
    expect(tree.indexOf("rect#rect1")).toBeLessThan(tree.indexOf("text#t1"));
  });

  it("avoids explicit id collisions when synthesizing ids", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect id="rect1" x="0" y="0" width="1" height="1"/>
      <rect x="0" y="0" width="1" height="1"/>
      <g><circle cx="0" cy="0" r="1"/></g>
    </svg>`;
    const filePath = harness.writeFile("ids.svg", svg);
    const outcome = harness.success(`read "${filePath}"`);
    expect(outcome.warnings).toEqual([
      "assigned id rect2 to unnamed <rect>",
      "assigned id g1 to unnamed <g>",
      "assigned id circle1 to unnamed <circle>"
    ]);
    const document = harness.session.requireDocument();
    expect(document.find("rect2")).toBeDefined();
    expect(document.find("g1")).toBeDefined();
    expect(document.find("circle1")).toBeDefined();
  });

  it("round-trips structure, presentation attributes and text", () => {
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <g id="g1" transform="translate(10,20)" opacity="0.5">
        <rect id="r1" x="1" y="2" width="30" height="40" fill="#abc" stroke="#000" stroke-width="2" rx="3"/>
        <text id="t1" x="4" y="5" font-size="12">A &amp; B &lt; C</text>
      </g>
    </svg>`;
    harness.success(`read "${harness.writeFile("source.svg", source)}"`);
    const savedPath = harness.path("roundtrip.svg");
    harness.success(`save "${savedPath}"`);
    const written = readFileSync(savedPath, "utf8");
    expect(written).toContain('id="g1"');
    expect(written).toContain('transform="translate(10,20)"');
    expect(written).toContain('opacity="0.5"');
    expect(written).toContain('fill="#abc"');
    expect(written).toContain('stroke-width="2"');
    expect(written).toContain('rx="3"');
    expect(written).toContain("A &amp; B &lt; C");

    harness.success(`read "${savedPath}"`);
    const document = harness.session.requireDocument();
    expect(document.find("g1")?.getAttributeValue("transform")).toBeUndefined();
    expect(document.find("g1")?.extraAttributeEntries).toContainEqual([
      "transform",
      "translate(10,20)"
    ]);
    expect(document.find("t1")?.getAttributeValue("text")).toBe("A & B < C");
    expect(harness.success("tree").message).toContain('"A & B < C"');
  });

  it("serializes a valid SVG document with deterministic indentation", () => {
    harness.success("init 400 200");
    harness.success("create g g1");
    harness.success("create rect r1 0 0 10 10 red in g1");
    harness.success('create text t1 5 6 "<&>"');
    harness.success("create g empty");
    const filePath = harness.path("format.svg");
    harness.success(`save "${filePath}"`);
    const written = readFileSync(filePath, "utf8");
    expect(written.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(written).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">'
    );
    expect(written).toContain('  <g id="g1">\n    <rect id="r1"');
    expect(written).toContain("<text id=\"t1\" x=\"5\" y=\"6\">&lt;&amp;&gt;</text>");
    expect(written).toContain('<g id="empty"/>');
    expect(written.endsWith("</svg>\n")).toBe(true);
  });

  it("overwrites an existing file atomically", () => {
    harness.success("init 100 100");
    const filePath = harness.path("overwrite.svg");
    harness.success(`save "${filePath}"`);
    harness.success("create rect r1 0 0 10 10");
    harness.success(`save "${filePath}"`);
    expect(readFileSync(filePath, "utf8")).toContain('id="r1"');
  });

  it("reads width/height with px and falls back to viewBox", () => {
    const pxPath = harness.writeFile(
      "px.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="120px" height="90px"><rect id="r1" x="0" y="0" width="1" height="1"/></svg>'
    );
    expect(harness.success(`read "${pxPath}"`).message).toContain("(1 elements)");
    expect(harness.session.requireDocument().width).toBe(120);

    const viewBoxPath = harness.writeFile(
      "viewbox.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect id="r1" x="0" y="0" width="1" height="1"/></svg>'
    );
    harness.success(`read "${viewBoxPath}"`);
    expect(harness.session.requireDocument().width).toBe(640);
    expect(harness.session.requireDocument().height).toBe(480);
  });

  it("rejects duplicate ids and unsupported visual elements", () => {
    const duplicatePath = harness.writeFile(
      "duplicate.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="x" x="0" y="0" width="1" height="1"/><circle id="x" cx="0" cy="0" r="1"/></svg>'
    );
    expect(harness.run(`read "${duplicatePath}"`).error).toBe(
      "cannot parse SVG: duplicate id: x"
    );

    const pathPath = harness.writeFile(
      "path.svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path id="p" d="M0 0L1 1"/></svg>'
    );
    expect(harness.run(`read "${pathPath}"`).error).toBe(
      "cannot parse SVG: unsupported SVG element: path"
    );
  });

  it("rejects malformed XML without replacing the current document", () => {
    harness.success("init 100 100");
    harness.success("create rect r1 0 0 10 10");
    const malformedPath = harness.writeFile("malformed.svg", "<svg><rect");
    const outcome = harness.run(`read "${malformedPath}"`);
    expect(outcome.error?.startsWith("cannot parse SVG:")).toBe(true);
    expect(harness.session.requireDocument().find("r1")).toBeDefined();
  });

  it("ignores metadata-only elements but keeps document order", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <title>Example</title>
      <desc>description</desc>
      <defs><rect id="unused" x="0" y="0" width="1" height="1"/></defs>
      <rect id="r1" x="0" y="0" width="1" height="1"/>
      <g id="g1"><title>inside</title><circle id="c1" cx="0" cy="0" r="1"/></g>
    </svg>`;
    harness.success(`read "${harness.writeFile("metadata.svg", svg)}"`);
    const document = harness.session.requireDocument();
    expect(document.shapeCount).toBe(3);
    expect(document.find("unused")).toBeUndefined();
    expect(harness.success("tree").message.indexOf("r1")).toBeLessThan(
      harness.success("tree").message.indexOf("c1")
    );
  });

  it("rejects ids containing whitespace", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="bad id" x="0" y="0" width="1" height="1"/></svg>';
    expect(harness.run(`read "${harness.writeFile("bad-id.svg", svg)}"`).error).toBe(
      "cannot parse SVG: id must not contain whitespace: bad id"
    );
  });

  it("reports missing/unreadable files with the required message", () => {
    expect(harness.run('read "not-there.svg"').error).toBe(
      "cannot read file: not-there.svg"
    );
  });
});
