import { GroupShape } from "../../domain/model/GroupShape.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";

/** Detailed `show` output: geometry, text, presentation and preserved extras. */
export class ShapeDetailsFormatter {
  public format(document: SvgDocument, shapeId: string): string {
    const shape = document.find(shapeId);
    if (shape === undefined) {
      throw new UserError(`no such shape: ${shapeId}`);
    }
    const parentLabel = document.isRootChild(shape) ? "svg" : document.parentOf(shape).treeLabel;
    const lines: string[] = [`${shape.treeLabel}  parent=${parentLabel}`];

    if (shape.geometryEntries.length > 0) {
      const geometry = shape.geometryEntries
        .map(([name, value]) => `${name}=${NumberFormat.format(value)}`)
        .join(" ");
      lines.push(`  ${geometry}`);
    }

    const text = shape.getAttributeValue("text");
    if (text !== undefined) {
      lines.push(`  text=${JSON.stringify(text)}`);
    }
    for (const [name, value] of shape.presentationEntries) {
      lines.push(`  ${name}=${value}`);
    }
    if (shape instanceof GroupShape) {
      lines.push(`  children=${shape.childCount}`);
    }
    for (const [name, value] of shape.extraAttributeEntries) {
      lines.push(`  ${name}=${value}`);
    }
    return lines.join("\n");
  }
}
