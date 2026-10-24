import { UserError } from "../../shared/UserError.js";

/** Small argument-count guard used by CLI handlers. */
export class ArgumentCheck {
  public static exact(args: readonly string[], count: number, usage: string): void {
    if (args.length !== count) {
      throw new UserError(`usage: ${usage}`);
    }
  }

  public static between(
    args: readonly string[],
    minimum: number,
    maximum: number,
    usage: string
  ): void {
    if (args.length < minimum || args.length > maximum) {
      throw new UserError(`usage: ${usage}`);
    }
  }

  public static atLeast(args: readonly string[], minimum: number, usage: string): void {
    if (args.length < minimum) {
      throw new UserError(`usage: ${usage}`);
    }
  }
}
