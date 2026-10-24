import { NumberFormat } from "../../shared/NumberFormat.js";
import { UserError } from "../../shared/UserError.js";

const UNIT_FACTORS: Readonly<Record<string, number>> = {
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6
};

/**
 * SVG length normalization for imported files. Shapes are stored in px/user
 * units; absolute CSS units are converted at the SVG 96 dpi reference. Percent
 * and font-relative units are rejected because they need a layout context.
 */
export class SvgLength {
  public static toUserUnits(raw: string, label: string): number {
    const text = raw.trim();
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*(px|pt|pc|in|cm|mm|q)?$/iu.exec(
      text
    );
    if (match === null) {
      throw new UserError(`invalid length for ${label}: ${raw}`);
    }
    const numeric = NumberFormat.parse(match[1] ?? "", label);
    const unit = (match[2] ?? "px").toLowerCase();
    const factor = UNIT_FACTORS[unit];
    if (factor === undefined) {
      throw new UserError(`unsupported length unit for ${label}: ${unit}`);
    }
    return numeric * factor;
  }
}
