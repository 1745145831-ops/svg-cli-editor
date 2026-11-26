import type { Shape } from "../../domain/model/Shape.js";
import { SvgLength } from "../../domain/factory/SvgLength.js";
import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";

const COMMON_ATTRIBUTES = ["fill", "stroke", "stroke-width"] as const;

/** Shared parsing/presentation rules for the built-in ShapeProviders. */
export class SvgProviderSupport {
  public static requireArgCount(
    type: string,
    args: readonly string[],
    minimum: number,
    maximum: number,
    usage: string
  ): void {
    if (args.length < minimum || args.length > maximum) {
      throw new UserError(`usage: create ${type} ${usage}`);
    }
  }

  public static optionalStyle(shape: Shape, raw: string | undefined, name: string): void {
    if (raw !== undefined) {
      shape.setPresentationAttribute(name, raw);
    }
  }

  public static applySvgAttributes(
    shape: Shape,
    attributes: ReadonlyMap<string, string>,
    geometryNames: readonly string[]
  ): void {
    for (const name of COMMON_ATTRIBUTES) {
      const value = attributes.get(name);
      if (value === undefined) {
        continue;
      }
      if (name === "stroke-width") {
        shape.setPresentationAttribute(
          name,
          NumberFormat.format(SvgLength.toUserUnits(value, name))
        );
      } else {
        shape.setPresentationAttribute(name, value);
      }
    }
    const known = new Set<string>(["id", ...COMMON_ATTRIBUTES, ...geometryNames]);
    for (const [name, value] of attributes) {
      if (!known.has(name)) {
        shape.setExtraAttribute(name, value);
      }
    }
  }

  public static svgNumber(
    attributes: ReadonlyMap<string, string>,
    name: string,
    fallback: number
  ): number {
    const raw = attributes.get(name);
    return raw === undefined ? fallback : SvgLength.toUserUnits(raw, name);
  }

  public static svgDimension(
    attributes: ReadonlyMap<string, string>,
    name: string
  ): number {
    const raw = attributes.get(name);
    return raw === undefined ? 0 : SvgLength.toUserUnits(raw, name);
  }
}
