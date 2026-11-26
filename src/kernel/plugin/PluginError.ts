export type PluginErrorKind =
  | "manifest-mismatch"
  | "duplicate-registration"
  | "activation-failed";

/** A recoverable plugin-load error. The host prefixes its message with `error:`. */
export class PluginError extends Error {
  public constructor(
    public readonly kind: PluginErrorKind,
    message: string
  ) {
    super(message);
    this.name = "PluginError";
  }
}
