/**
 * Outcome of one command. `warnings` are printed before `message`; they are
 * used by `read` when ids have to be synthesized.
 */
export interface CommandResult {
  readonly message: string;
  readonly warnings?: readonly string[];
  readonly exit?: boolean;
}
