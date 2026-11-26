import type { Shape } from "../../domain/model/Shape.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";

export interface TreeRow {
  readonly document: SvgDocument;
  /** null identifies the synthetic root `svg (...)` row. */
  readonly shape: Shape | null;
}

/** Extension point for one end-of-line label in `tree` output. */
export interface TreeDecorator {
  readonly name: string;
  decorate(row: TreeRow): string | null;
}
