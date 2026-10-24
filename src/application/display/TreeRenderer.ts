import { GroupShape } from "../../domain/model/GroupShape.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import type { Shape } from "../../domain/model/Shape.js";

/**
 * Renders the structural tree with inline geometry. Summaries are aligned per
 * sibling group, which keeps deep diagrams readable in a terminal.
 */
export class TreeRenderer {
  public render(document: SvgDocument, rootId?: string): string {
    const lines: string[] = [];
    if (rootId === undefined) {
      lines.push(
        `svg (${NumberFormat.format(document.width)}x${NumberFormat.format(document.height)})`
      );
      this.renderChildren(document.rootChildren, "", lines);
      return lines.join("\n");
    }

    const shape = document.find(rootId);
    if (shape === undefined) {
      throw new UserError(`no such shape: ${rootId}`);
    }
    const summary = shape.treeSummary;
    lines.push(summary.length === 0 ? shape.treeLabel : `${shape.treeLabel}  ${summary}`);
    this.renderChildren(shape instanceof GroupShape ? shape.children : [], "", lines);
    return lines.join("\n");
  }

  private renderChildren(
    children: readonly Shape[],
    prefix: string,
    lines: string[]
  ): void {
    if (children.length === 0) {
      return;
    }
    const labelWidth = Math.max(
      ...children.map((child) => Array.from(child.treeLabel).length)
    );
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const summary = child.treeSummary;
      let line = `${prefix}${connector}${child.treeLabel}`;
      if (summary.length > 0) {
        line += " ".repeat(labelWidth - Array.from(child.treeLabel).length + 2);
        line += summary;
      }
      lines.push(line);
      if (child instanceof GroupShape) {
        this.renderChildren(child.children, `${prefix}${isLast ? "    " : "│   "}`, lines);
      }
    });
  }
}
