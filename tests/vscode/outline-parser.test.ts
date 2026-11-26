import { describe, expect, it } from "vitest";
import {
  outlineLabel,
  SvgOutlineParser,
  type OutlineNode
} from "../../vscode-extension/src/outlineParser.js";
import { isSvgFileUri } from "../../vscode-extension/src/svgFile.js";

const parser = new SvgOutlineParser();

function labels(nodes: readonly OutlineNode[]): string[] {
  return nodes.map((node) => outlineLabel(node));
}

describe("SVG outline parser", () => {
  it("keeps nested groups and leaves with tag/id labels", () => {
    const result = parser.parse(
      `<svg xmlns="http://www.w3.org/2000/svg">
        <g id="flowchart">
          <g id="node1">
            <rect id="start" x="0" y="0" width="10" height="10"/>
            <text>plain</text>
          </g>
          <line id="arrow"/>
        </g>
      </svg>`
    );
    expect(result.malformed).toBe(false);
    expect(labels(result.roots)).toEqual(["svg"]);
    const svg = result.roots[0];
    expect(svg?.children.map((child) => outlineLabel(child))).toEqual(["g#flowchart"]);
    const flowchart = svg?.children[0];
    expect(flowchart?.children.map((child) => outlineLabel(child))).toEqual([
      "g#node1",
      "line#arrow"
    ]);
    expect(flowchart?.children[0]?.children.map((child) => outlineLabel(child))).toEqual([
      "rect#start",
      "text"
    ]);
  });

  it("omits empty ids and keeps source offsets for navigation", () => {
    const source = `<svg>\n  <g id="">\n    <rect id="r1"/>\n  </g>\n</svg>`;
    const result = parser.parse(source);
    const g = result.roots[0]?.children[0];
    expect(g === undefined ? "" : outlineLabel(g)).toBe("g");
    const rect = g?.children[0];
    expect(rect === undefined ? "" : outlineLabel(rect)).toBe("rect#r1");
    expect(source.slice(rect?.nameStart ?? 0, rect?.nameEnd ?? 0)).toBe("rect");
    expect(source.slice(g?.nameStart ?? 0, g?.nameEnd ?? 0)).toBe("g");
  });

  it("updates the hierarchy after an edit", () => {
    const before = parser.parse(`<svg><g id="a"><rect id="one"/></g></svg>`);
    const after = parser.parse(
      `<svg><g id="a"><rect id="one"/><circle id="two"/></g><text id="caption">x</text></svg>`
    );
    expect(before.roots[0]?.children[0]?.children).toHaveLength(1);
    expect(after.roots[0]?.children[0]?.children.map((node) => outlineLabel(node))).toEqual([
      "rect#one",
      "circle#two"
    ]);
    expect(labels(after.roots[0]?.children ?? [])).toEqual(["g#a", "text#caption"]);
  });

  it("survives incomplete XML while editing", () => {
    const result = parser.parse(
      `<svg><g id="flow"><rect id="r1" x="10`
    );
    expect(result.malformed).toBe(true);
    expect(labels(result.roots)).toEqual(["svg"]);
    expect(labels(result.roots[0]?.children ?? [])).toEqual(["g#flow"]);
    // No phantom rect is produced for the half-typed opening tag.
    expect(result.roots[0]?.children[0]?.children).toHaveLength(0);
  });

  it("does not throw on mismatched closing tags or comments with markup", () => {
    expect(() => parser.parse("<svg><!-- <rect id='fake'/> --><g></svg></g>")).not.toThrow();
    const result = parser.parse(
      `<svg><!-- <rect id="fake"/> --><g id="real"><rect id="r1"/></g></svg>`
    );
    expect(labels(result.roots[0]?.children ?? [])).toEqual(["g#real"]);
    expect(result.roots[0]?.children[0]?.children.map((node) => outlineLabel(node))).toEqual([
      "rect#r1"
    ]);
  });

  it("accepts > inside quoted attributes and self-closing roots", () => {
    const result = parser.parse(`<svg data-note="a > b"><rect id="r1"/></svg>`);
    expect(result.malformed).toBe(false);
    expect(result.roots[0]?.children.map((node) => outlineLabel(node))).toEqual(["rect#r1"]);
    const selfClosing = parser.parse(`<svg/>`);
    expect(selfClosing.roots[0]?.end).toBe(6);
  });

  it("only treats local .svg file URIs as badge candidates", () => {
    expect(isSvgFileUri({ scheme: "file", path: "/tmp/example.svg" })).toBe(true);
    expect(isSvgFileUri({ scheme: "file", path: "C:\\tmp\\EXAMPLE.SVG" })).toBe(true);
    expect(isSvgFileUri({ scheme: "untitled", path: "/tmp/example.svg" })).toBe(false);
    expect(isSvgFileUri({ scheme: "file", path: "/tmp/notes.txt" })).toBe(false);
    expect(isSvgFileUri({ scheme: "file", path: "/tmp/svg" })).toBe(false);
  });
});
