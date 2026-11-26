import type { TreeDecorator, TreeRow } from "../../kernel/plugin/TreeDecorator.js";

/** Adds `(box)` to box container rows without knowing about other labels. */
export class BoxTypeDecorator implements TreeDecorator {
  public readonly name = "box-type-label";

  public decorate(row: TreeRow): string | null {
    return row.shape?.typeName === "box" ? "(box)" : null;
  }
}
