import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import type { Element } from "@xmldom/xmldom";
import type { SvgReadResult } from "../../application/gateway/SvgReadResult.js";
import type { ShapeFactory } from "../../domain/factory/ShapeFactory.js";
import { SvgLength } from "../../domain/factory/SvgLength.js";
import { GroupShape } from "../../domain/model/GroupShape.js";
import { Shape, type SvgAttributeEntry } from "../../domain/model/Shape.js";
import { SvgDocument } from "../../domain/model/SvgDocument.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";

const IGNORED_TAGS = new Set([
  "title",
  "desc",
  "metadata",
  "defs",
  "style",
  "script"
]);

/**
 * Imports the supported SVG subset with DOM traversal (document order is
 * preserved). Missing ids are synthesized per tag and reported as warnings.
 */
export class SvgDocumentReader {
  public constructor(private readonly shapeFactory: ShapeFactory) {}

  public read(filePath: string): SvgReadResult {
    let xml: string;
    try {
      xml = readFileSync(filePath, "utf8");
    } catch {
      throw new UserError(`cannot read file: ${filePath}`);
    }
    if (xml.charCodeAt(0) === 0xfeff) {
      xml = xml.slice(1);
    }
    try {
      return this.parse(xml);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new UserError(`cannot parse SVG: ${detail}`);
    }
  }

  private parse(xml: string): SvgReadResult {
    const parseErrors: string[] = [];
    const parser = new DOMParser({
      onError: (level, message) => {
        if (level === "error" || level === "fatalError") {
          parseErrors.push(message);
        }
      }
    });
    const dom = parser.parseFromString(xml, "text/xml");
    if (parseErrors.length > 0) {
      throw new UserError(parseErrors[0] ?? "invalid XML");
    }
    const root = dom.documentElement;
    if (root === null || this.tagName(root) !== "svg") {
      throw new UserError("root element must be <svg>");
    }

    const viewBoxRaw = root.getAttribute("viewBox");
    const viewBox = this.viewBoxValues(viewBoxRaw);
    const width = this.readCanvasLength(root.getAttribute("width")) ?? viewBox?.[2] ?? 800;
    const height = this.readCanvasLength(root.getAttribute("height")) ?? viewBox?.[3] ?? 600;
    const warnings: string[] = [];
    const ids = this.assignIds(root, warnings);
    const document = new SvgDocument(width, height);
    const normalizedViewBox = viewBoxRaw?.trim() ??
      `0 0 ${NumberFormat.format(width)} ${NumberFormat.format(height)}`;
    document.applyRootMetadata(normalizedViewBox, this.readRootAttributes(root));

    for (const child of this.elementChildren(root)) {
      const shape = this.convertElement(child, ids);
      if (shape !== null) {
        document.attach(shape);
      }
    }
    return { document, warnings };
  }

  private convertElement(
    element: Element,
    ids: ReadonlyMap<Element, string>
  ): Shape | null {
    const tag = this.tagName(element);
    if (IGNORED_TAGS.has(tag)) {
      return null;
    }
    if (!this.shapeFactory.isSupportedSvgTag(tag)) {
      throw new UserError(`unsupported SVG element: ${tag}`);
    }
    const id = ids.get(element);
    if (id === undefined) {
      throw new UserError(`missing id for <${tag}>`);
    }
    const attributes = this.readAttributes(element);
    const isText = tag === "text";
    const textContent = isText ? (element.textContent ?? "") : "";
    const shape = this.shapeFactory.createFromSvgElement(tag, id, attributes, textContent);

    if (shape instanceof GroupShape) {
      for (const child of this.elementChildren(element)) {
        const childShape = this.convertElement(child, ids);
        if (childShape !== null) {
          shape.appendChild(childShape);
        }
      }
      return shape;
    }

    for (const child of this.elementChildren(element)) {
      const childTag = this.tagName(child);
      if (!IGNORED_TAGS.has(childTag)) {
        throw new UserError(`unsupported nested element <${childTag}> inside <${tag}>`);
      }
    }
    return shape;
  }

  private assignIds(root: Element, warnings: string[]): Map<Element, string> {
    const used = new Set<string>();
    const assigned = new Map<Element, string>();

    const collectExplicit = (parent: Element): void => {
      for (const element of this.elementChildren(parent)) {
        const tag = this.tagName(element);
        if (IGNORED_TAGS.has(tag)) {
          continue;
        }
        if (this.shapeFactory.isSupportedSvgTag(tag)) {
          const id = element.getAttribute("id");
          if (id !== null && id.length > 0) {
            if (used.has(id)) {
              throw new UserError(`duplicate id: ${id}`);
            }
            Shape.assertValidId(id);
            used.add(id);
            assigned.set(element, id);
          }
        }
        if (this.shapeFactory.isContainerTag(tag)) {
          collectExplicit(element);
        }
      }
    };

    const counters = new Map<string, number>();
    const fillMissing = (parent: Element): void => {
      for (const element of this.elementChildren(parent)) {
        const tag = this.tagName(element);
        if (IGNORED_TAGS.has(tag)) {
          continue;
        }
        if (this.shapeFactory.isSupportedSvgTag(tag)) {
          if (!assigned.has(element)) {
            let counter = counters.get(tag) ?? 1;
            let candidate = `${tag}${counter}`;
            while (used.has(candidate)) {
              counter += 1;
              candidate = `${tag}${counter}`;
            }
            counters.set(tag, counter + 1);
            used.add(candidate);
            assigned.set(element, candidate);
            warnings.push(`assigned id ${candidate} to unnamed <${tag}>`);
          } else {
            counters.set(tag, (counters.get(tag) ?? 1) + 1);
          }
        }
        if (this.shapeFactory.isContainerTag(tag)) {
          fillMissing(element);
        }
      }
    };

    collectExplicit(root);
    fillMissing(root);
    return assigned;
  }

  private readAttributes(element: Element): ReadonlyMap<string, string> {
    const attributes = new Map<string, string>();
    for (let index = 0; index < element.attributes.length; index += 1) {
      const attribute = element.attributes.item(index);
      if (attribute === null) {
        continue;
      }
      const name = attribute.name;
      if (name === "xmlns") {
        continue;
      }
      attributes.set(name, attribute.value);
    }
    return attributes;
  }

  private readRootAttributes(root: Element): readonly SvgAttributeEntry[] {
    const result: SvgAttributeEntry[] = [];
    for (let index = 0; index < root.attributes.length; index += 1) {
      const attribute = root.attributes.item(index);
      if (attribute === null) {
        continue;
      }
      const name = attribute.name;
      if (["width", "height", "viewBox", "xmlns"].includes(name)) {
        continue;
      }
      result.push([name, attribute.value]);
    }
    return result;
  }

  private elementChildren(parent: Element): Element[] {
    const result: Element[] = [];
    const nodes = parent.childNodes;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.item(index);
      if (node !== null && node.nodeType === 1) {
        result.push(node as Element);
      }
    }
    return result;
  }

  private tagName(element: Element): string {
    const raw = element.localName ?? element.tagName;
    const parts = raw.split(":");
    return parts[parts.length - 1] ?? raw;
  }

  private readCanvasLength(raw: string | null): number | null {
    if (raw === null || raw.trim().length === 0 || raw.trim().endsWith("%")) {
      return null;
    }
    const value = SvgLength.toUserUnits(raw, "canvas size");
    if (value <= 0) {
      throw new UserError("canvas size must be positive");
    }
    return value;
  }

  private viewBoxValues(raw: string | null): readonly number[] | null {
    if (raw === null) {
      return null;
    }
    const parts = raw.trim().split(/[\s,]+/u);
    if (parts.length !== 4) {
      throw new UserError(`invalid viewBox: ${raw}`);
    }
    return parts.map((part, index) => NumberFormat.parse(part, `viewBox[${index}]`));
  }
}
