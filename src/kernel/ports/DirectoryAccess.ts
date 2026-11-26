export type DirectoryEntryKind = "file" | "directory" | "other";

export interface DirectoryEntry {
  readonly name: string;
  readonly kind: DirectoryEntryKind;
}

/**
 * Outbound port used by the `dir` command plugin. The plugin never imports
 * Node's fs; the host injects a real adapter and tests inject a test double.
 */
export interface DirectoryAccess {
  /** Returns direct children only. Implementations must not sort the result. */
  list(path: string): readonly DirectoryEntry[];
}
