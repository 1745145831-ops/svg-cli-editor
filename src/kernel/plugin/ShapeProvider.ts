import type { Shape } from "../../domain/model/Shape.js";

export interface ShapeCreateRequest {
  readonly type: string;
  readonly id: string;
  readonly args: readonly string[];
}

/** Children have already been converted when a container provider receives them. */
export interface SvgShapeRequest {
  readonly tag: string;
  readonly id: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly textContent: string;
  readonly children: readonly Shape[];
}

/**
 * Extension point for one shape type. A provider owns both the CLI-creation
 * mapping and the SVG import mapping, so the core never switches on a type
 * name or tag name.
 */
export interface ShapeProvider {
  /** Stable registration name and the value accepted by `create <type>`. */
  readonly shapeType: string;
  /** SVG tags this provider can read. Several providers may share `g`. */
  readonly svgTags: readonly string[];
  readonly isContainer: boolean;
  /** Higher priority wins when several providers match one SVG element. */
  readonly svgPriority?: number;
  /** Optional CLI help line body, e.g. `box <id> <x> <y> <w> <h> "label"`. */
  readonly helpUsage?: string;
  /** Number of arguments after `<id>` when the last argument may be the text `in`. */
  readonly fixedCliArgumentCount?: number;

  /**
   * Returns true when this provider owns the element. Defaults to matching
   * `svgTags`; box narrows `g` with `data-kind="box"`.
   */
  matchesSvg?(tag: string, attributes: ReadonlyMap<string, string>): boolean;
  createFromCli(request: ShapeCreateRequest): Shape;
  createFromSvg(request: SvgShapeRequest): Shape;
}
