import { describe, expect, it } from "vitest";
import { AttributeDisplay } from "../../src/shared/AttributeDisplay.js";
import { NumberFormat } from "../../src/shared/NumberFormat.js";
import { UserError } from "../../src/shared/UserError.js";

describe("NumberFormat", () => {
  it("formats floating point noise and negative zero predictably", () => {
    expect(NumberFormat.format(0.1 + 0.2)).toBe("0.3");
    expect(NumberFormat.format(-0)).toBe("0");
    expect(NumberFormat.format(1e-13)).toBe("0");
    expect(NumberFormat.format(12.5)).toBe("12.5");
  });

  it("parses finite numbers and rejects empty/non-finite input", () => {
    expect(NumberFormat.parse(" 1.5 ", "x")).toBe(1.5);
    expect(() => NumberFormat.parse("", "x")).toThrow(UserError);
    expect(() => NumberFormat.parse("Infinity", "x")).toThrow(
      "invalid number for x: Infinity"
    );
    expect(() => NumberFormat.format(Number.NaN)).toThrow(UserError);
  });

  it("enforces non-negative and positive constraints", () => {
    expect(NumberFormat.parseNonNegative("0", "width")).toBe(0);
    expect(() => NumberFormat.parseNonNegative("-1", "width")).toThrow(
      "width must be non-negative"
    );
    expect(NumberFormat.parsePositive("0.5", "factor")).toBe(0.5);
    expect(() => NumberFormat.parsePositive("0", "factor")).toThrow(
      "factor must be positive"
    );
  });
});

describe("AttributeDisplay", () => {
  it("quotes text values and marks missing values explicitly", () => {
    expect(AttributeDisplay.format("fill", "red")).toBe("red");
    expect(AttributeDisplay.format("text", 'a "b"')).toBe('"a \\"b\\""');
    expect(AttributeDisplay.formatOrUnset("fill", undefined)).toBe("(unset)");
  });
});
