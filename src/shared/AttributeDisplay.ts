/**
 * Display rules shared by `set`/undo summaries and `show`.
 */
export class AttributeDisplay {
  public static format(name: string, value: string): string {
    if (name === "text") {
      return JSON.stringify(value);
    }
    return value;
  }

  public static formatOrUnset(name: string, value: string | undefined): string {
    return value === undefined ? "(unset)" : AttributeDisplay.format(name, value);
  }
}
