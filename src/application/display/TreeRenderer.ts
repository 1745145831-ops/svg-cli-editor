import { GroupShape } from "../../domain/model/GroupShape.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { TreeDecoratorRegistry } from "../../kernel/plugin/TreeDecoratorRegistry.js";

/**
 * Renders the structural tree with inline geometry and plugin-contributed
 * end-of-line labels. With no decorators the output is byte-identical to
 * Phase 1.
 */
export class TreeRenderer {
  public constructor(private readonly decorators?: TreeDecoratorRegistry) {}

  public render(document: SvgDocument, rootId?: string): string {
    const lines: string[] = [];
    if (rootId === undefined) {
      lines.push(
        `${this.withLabels(
          `svg (${NumberFormat.format(document.width)}x${NumberFormat.format(document.height)})`,
          document,
          null
        )}`
      );
      this.renderChildren(document.rootChildren, "", lines, document);
      return lines.join("\n");
    }

    const shape = document.find(rootId);
    if (shape === undefined) {
      throw new UserError(`no such shape: ${rootId}`);
    }
    const summary = shape.treeSummary;
    const base = summary.length === 0 ? shape.treeLabel : `${shape.treeLabel}  ${summary}`;
    lines.push(this.withLabels(base, document, shape));
    this.renderChildren(shape instanceof GroupShape ? shape.children : [], "", lines, document);
    return lines.join("\n");
  }

  private renderChildren(
    children: readonly Shape[],
    prefix: string,
    lines: string[],
    document: SvgDocument
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
      lines.push(this.withLabels(line, document, child));
      if (child instanceof GroupShape) {
        this.renderChildren(
          child.children,
          `${prefix}${isLast ? "    " : "│   "}`,
          lines,
          document
        );
      }
    });
  }

  private withLabels(base: string, document: SvgDocument, shape: Shape | null): string {
    const labels = this.decorators?.decorationsFor({ document, shape }) ?? [];
    return labels.length === 0 ? base : `${base} ${labels.join(" ")}`;
  }
}
