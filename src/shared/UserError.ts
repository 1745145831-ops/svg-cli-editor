/**
 * An error that is safe to show to the CLI user. The CLI adds the `error: `
 * prefix, so messages stored here never include it.
 */
export class UserError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
