import { readdirSync, type Dirent } from "node:fs";
import type { DirectoryAccess, DirectoryEntry } from "../../kernel/ports/DirectoryAccess.js";
import { UserError } from "../../shared/UserError.js";

/** Filesystem adapter for the `dir` command's DirectoryAccess port. */
export class NodeDirectoryAccess implements DirectoryAccess {
  public list(path: string): readonly DirectoryEntry[] {
    let entries: Dirent[];
    try {
      entries = readdirSync(path, { withFileTypes: true });
    } catch {
      throw new UserError(`cannot read directory: ${path}`);
    }
    return entries.map((entry) => ({
      name: entry.name,
      kind: entry.isDirectory()
        ? "directory"
        : entry.isFile()
          ? "file"
          : "other"
    }));
  }
}
