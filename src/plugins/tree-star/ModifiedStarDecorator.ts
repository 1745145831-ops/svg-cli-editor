import { GroupShape } from "../../domain/model/GroupShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import type {
  DocumentEvent,
  DocumentEventSubscriber
} from "../../kernel/ports/DocumentEvents.js";
import type { TreeDecorator, TreeRow } from "../../kernel/plugin/TreeDecorator.js";

interface Baseline {
  readonly own: ReadonlyMap<string, string>;
  readonly document: string;
}

/**
 * Dirty state is "content differs from the last successful save/load". All
 * state lives on this instance. Ancestors are not marked for descendant edits;
 * the root is the document summary and does compare the whole document.
 */
export class ModifiedStarDecorator implements TreeDecorator, DocumentEventSubscriber {
  public readonly name = "modified-star";
  private baseline: Baseline | null = null;

  public onDocumentEvent(event: DocumentEvent): void {
    this.baseline = this.snapshot(event.document);
  }

  public decorate(row: TreeRow): string | null {
    if (this.baseline === null) {
      return null;
    }
    if (row.shape === null) {
      return this.documentSignature(row.document) === this.baseline.document ? null : "*";
    }
    const previous = this.baseline.own.get(row.shape.id);
    return previous === this.ownSignature(row.shape) ? null : "*";
  }

  private snapshot(document: SvgDocument): Baseline {
    const own = new Map<string, string>();
    for (const shape of document.documentOrder()) {
      own.set(shape.id, this.ownSignature(shape));
    }
    return { own, document: this.documentSignature(document) };
  }

  private ownSignature(shape: Shape): string {
    return JSON.stringify({
      type: shape.typeName,
      tag: shape.svgTagName,
      attributes: shape.getSvgAttributes(),
      text: shape.svgTextContent,
      children: shape instanceof GroupShape ? shape.children.map((child) => child.id) : []
    });
  }

  private documentSignature(document: SvgDocument): string {
    return JSON.stringify({
      width: document.width,
      height: document.height,
      viewBox: document.viewBox,
      root: document.rootExtraAttributes,
      shapes: document.documentOrder().map((shape) => [shape.id, this.ownSignature(shape)])
    });
  }
}
