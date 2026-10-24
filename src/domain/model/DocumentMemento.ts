import type { GroupShape } from "./GroupShape.js";
import type { SvgAttributeEntry } from "./Shape.js";

/**
 * Immutable snapshot of a document. The root is private and is cloned on every
 * restore, so the same snapshot can safely be restored many times.
 */
export class DocumentMemento {
  public constructor(
    private readonly widthValue: number,
    private readonly heightValue: number,
    private readonly viewBoxValue: string,
    private readonly rootAttributes: ReadonlyMap<string, string>,
    private readonly rootValue: GroupShape
  ) {}

  public get width(): number {
    return this.widthValue;
  }

  public get height(): number {
    return this.heightValue;
  }

  public get viewBox(): string {
    return this.viewBoxValue;
  }

  public get rootExtraAttributes(): readonly SvgAttributeEntry[] {
    return [...this.rootAttributes.entries()];
  }

  public createRootClone(): GroupShape {
    return this.rootValue.cloneShape();
  }
}
