import { describe, expect, it } from "vitest";
import { ShapeFactory } from "../../src/domain/factory/ShapeFactory.js";
import { GroupShape } from "../../src/domain/model/GroupShape.js";
import { RectShape } from "../../src/domain/model/RectShape.js";
import { SvgDocument } from "../../src/domain/model/SvgDocument.js";
import { UserError } from "../../src/shared/UserError.js";

describe("shape model", () => {
  it("moves and scales a group recursively through all descendants", () => {
    const factory = new ShapeFactory();
    const document = new SvgDocument(800, 600);
    const group = new GroupShape("g1");
    document.attach(group);
    const rect = factory.createFromCreateArgs("rect", "r1", [
      "10",
      "20",
      "30",
      "40",
      "red"
    ]);
    const text = factory.createFromCreateArgs("text", "t1", ["5", "6", "note"]);
    document.attach(rect, group);
    document.attach(text, group);

    group.moveBy(5, 7);
    expect(rect.geometryEntries).toEqual([
      ["x", 15],
      ["y", 27],
      ["width", 30],
      ["height", 40]
    ]);
    expect(text.geometryEntries).toEqual([
      ["x", 10],
      ["y", 13]
    ]);

    group.scaleBy(2);
    expect(rect.geometryEntries).toEqual([
      ["x", 30],
      ["y", 54],
      ["width", 60],
      ["height", 80]
    ]);
    expect(text.geometryEntries).toEqual([
      ["x", 20],
      ["y", 26]
    ]);
  });

  it("keeps the id index case-sensitive and rejects duplicates", () => {
    const document = new SvgDocument(100, 100);
    document.attach(new RectShape("A", 0, 0, 1, 1));
    document.attach(new RectShape("a", 0, 0, 1, 1));
    expect(document.find("A")?.id).toBe("A");
    expect(document.find("a")?.id).toBe("a");
    expect(() => document.attach(new RectShape("A", 0, 0, 1, 1))).toThrowError(
      "id already exists: A"
    );
  });

  it("restores the same memento repeatedly without mutating the snapshot", () => {
    const document = new SvgDocument(800, 600);
    const rect = new RectShape("r1", 10, 20, 30, 40);
    document.attach(rect);
    const snapshot = document.createMemento();

    rect.moveBy(100, 100);
    document.restore(snapshot);
    expect(document.find("r1")?.geometryEntries).toEqual([
      ["x", 10],
      ["y", 20],
      ["width", 30],
      ["height", 40]
    ]);

    const restored = document.find("r1");
    if (restored === undefined) {
      throw new Error("restored shape missing");
    }
    restored.moveBy(1, 1);
    document.restore(snapshot);
    expect(document.find("r1")?.geometryEntries).toEqual([
      ["x", 10],
      ["y", 20],
      ["width", 30],
      ["height", 40]
    ]);
  });

  it("applies typed attribute validation", () => {
    const rect = new RectShape("r1", 0, 0, 10, 10);
    rect.setAttribute("fill", "rebeccapurple");
    expect(rect.getAttributeValue("fill")).toBe("rebeccapurple");
    expect(() => rect.setAttribute("r", "4")).toThrowError("unknown attribute: r");
    expect(() => rect.setAttribute("width", "-3")).toThrowError(
      "width must be non-negative"
    );
    expect(rect.getAttributeValue("width")).toBe("10");
  });

  it("applies geometry setters, moves, scales and clones for every leaf type", () => {
    const factory = new ShapeFactory();
    const rect = factory.createFromCreateArgs("rect", "r", [
      "1",
      "2",
      "3",
      "4"
    ]);
    const circle = factory.createFromCreateArgs("circle", "c", ["1", "2", "3"]);
    const ellipse = factory.createFromCreateArgs("ellipse", "e", [
      "1",
      "2",
      "3",
      "4"
    ]);
    const line = factory.createFromCreateArgs("line", "l", [
      "1",
      "2",
      "3",
      "4"
    ]);
    const text = factory.createFromCreateArgs("text", "t", ["1", "2", "label"]);

    rect.setAttribute("height", "8");
    circle.setAttribute("r", "6");
    ellipse.setAttribute("ry", "9");
    line.setAttribute("x2", "11");
    text.setAttribute("y", "12");
    expect(rect.getAttributeValue("height")).toBe("8");
    expect(circle.getAttributeValue("r")).toBe("6");
    expect(ellipse.getAttributeValue("ry")).toBe("9");
    expect(line.getAttributeValue("x2")).toBe("11");
    expect(text.getAttributeValue("y")).toBe("12");

    for (const shape of [rect, circle, ellipse, line, text]) {
      shape.moveBy(2, 3);
      shape.scaleBy(2);
      expect(shape.cloneShape().geometryEntries).toEqual(shape.geometryEntries);
    }
    expect(rect.geometryEntries).toEqual([
      ["x", 6],
      ["y", 10],
      ["width", 6],
      ["height", 16]
    ]);
    expect(circle.geometryEntries).toEqual([
      ["cx", 6],
      ["cy", 10],
      ["r", 12]
    ]);
    expect(ellipse.geometryEntries).toEqual([
      ["cx", 6],
      ["cy", 10],
      ["rx", 6],
      ["ry", 18]
    ]);
    expect(line.geometryEntries).toEqual([
      ["x1", 6],
      ["y1", 10],
      ["x2", 26],
      ["y2", 14]
    ]);
    expect(text.geometryEntries).toEqual([
      ["x", 6],
      ["y", 30]
    ]);
  });

  it("rejects invalid ids", () => {
    expect(() => new RectShape("", 0, 0, 1, 1)).toThrow(UserError);
    expect(() => new RectShape("bad id", 0, 0, 1, 1)).toThrow(UserError);
  });
});
