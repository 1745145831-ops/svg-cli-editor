import { UserError } from "./UserError.js";

/**
 * Canonical number parsing/formatting for the domain. Keeping this in one
 * place prevents floating point noise such as 0.30000000000000004 from
 * leaking into SVG files and CLI summaries.
 */
export class NumberFormat {
  public static format(value: number): string {
    if (!Number.isFinite(value)) {
      throw new UserError(`invalid number: ${String(value)}`);
    }
    const normalized = Object.is(value, -0) ? 0 : value;
    const rounded = Math.abs(normalized) < 1e-12 ? 0 : normalized;
    return Number.parseFloat(rounded.toPrecision(15)).toString();
  }

  public static parse(raw: string, label: string): number {
    const text = raw.trim();
    if (text.length === 0) {
      throw new UserError(`invalid number for ${label}: <empty>`);
    }
    const value = Number(text);
    if (!Number.isFinite(value)) {
      throw new UserError(`invalid number for ${label}: ${raw}`);
    }
    return value;
  }

  public static parseNonNegative(raw: string, label: string): number {
    const value = NumberFormat.parse(raw, label);
    if (value < 0) {
      throw new UserError(`${label} must be non-negative`);
    }
    return value;
  }

  public static parsePositive(raw: string, label: string): number {
    const value = NumberFormat.parse(raw, label);
    if (value <= 0) {
      throw new UserError(`${label} must be positive`);
    }
    return value;
  }

  public static assertNonNegative(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new UserError(`invalid number for ${label}: ${String(value)}`);
    }
    if (value < 0) {
      throw new UserError(`${label} must be non-negative`);
    }
  }

  public static assertPositive(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new UserError(`invalid number for ${label}: ${String(value)}`);
    }
    if (value <= 0) {
      throw new UserError(`${label} must be positive`);
    }
  }
}
