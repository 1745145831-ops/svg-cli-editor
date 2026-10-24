import { renameSync, unlinkSync, writeFileSync } from "node:fs";
import { GroupShape } from "../../domain/model/GroupShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";

/** Deterministic SVG serializer and atomic file writer. */
export class SvgDocumentWriter {
  public serialize(document: SvgDocument): string {
    const width = NumberFormat.format(document.width);
    const height = NumberFormat.format(document.height);
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
        `viewBox="0 0 ${width} ${height}">`
    ];
    for (const shape of document.rootChildren) {
      lines.push(this.renderShape(shape, 1));
    }
    lines.push("</svg>");
    return `${lines.join("\n")}\n`;
  }

  public write(document: SvgDocument, filePath: string): void {
    if (filePath.length === 0) {
      throw new UserError("cannot write file: <empty path>");
    }
    const xml = this.serialize(document);
    const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    try {
      writeFileSync(temporaryPath, xml, "utf8");
      renameSync(temporaryPath, filePath);
    } catch {
      try {
        unlinkSync(temporaryPath);
      } catch {
        // The temporary file may not have been created; the original error is
        // the useful one.
      }
      throw new UserError(`cannot write file: ${filePath}`);
    }
  }

  private renderShape(shape: Shape, depth: number): string {
    const indent = "  ".repeat(depth);
    const attributes = shape.getSvgAttributes()
      .map(([name, value]) => ` ${name}="${this.escapeAttribute(value)}"`)
      .join("");
    const tag = shape.svgTagName;
    const open = `<${tag}${attributes}`;
    const textContent = shape.svgTextContent;

    if (textContent !== null) {
      return `${indent}${open}>${this.escapeText(textContent)}</${tag}>`;
    }
    if (shape instanceof GroupShape && shape.childCount > 0) {
      const nested = shape.children.map((child) => this.renderShape(child, depth + 1));
      return [`${indent}${open}>`, ...nested, `${indent}</${tag}>`].join("\n");
    }
    return `${indent}${open}/>`;
  }

  private escapeAttribute(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  private escapeText(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
