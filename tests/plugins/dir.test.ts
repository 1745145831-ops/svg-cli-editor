import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import dirPlugin from "../../src/plugins/dir/index.js";
import type { DirectoryAccess, DirectoryEntry } from "../../src/kernel/ports/DirectoryAccess.js";
import { PluginHost } from "../../src/host/PluginHost.js";
import { UserError } from "../../src/shared/UserError.js";
import { CommandHarness } from "../helpers/CommandHarness.js";

class FakeDirectoryAccess implements DirectoryAccess {
  public constructor(
    private readonly entries: readonly DirectoryEntry[],
    private readonly failure: Error | null = null
  ) {}

  public list(): readonly DirectoryEntry[] {
    if (this.failure !== null) {
      throw this.failure;
    }
    return this.entries;
  }
}

function output(host: PluginHost, line: string): string {
  const parsed = { name: line.split(" ")[0] ?? line, args: [] };
  return host.dispatcher.dispatch(parsed, host.context).message;
}

describe("dir command plugin", () => {
  let harness: CommandHarness;

  beforeEach(() => {
    harness = new CommandHarness();
    harness.activate(dirPlugin);
  });

  afterEach(() => {
    harness.dispose();
  });

  it("sorts directories then files, includes hidden entries, and omits dot entries", () => {
    const fake = new FakeDirectoryAccess([
      { name: "package.json", kind: "file" },
      { name: ".git", kind: "directory" },
      { name: "demo.svg", kind: "file" },
      { name: "plugins", kind: "directory" },
      { name: "docs", kind: "directory" },
      { name: "a.txt", kind: "file" },
      { name: "link", kind: "other" }
    ]);
    const host = new PluginHost("C:\\work", fake);
    host.activate(dirPlugin);
    expect(output(host, "dir")).toBe(
      [
        "[DIR]  .git",
        "[DIR]  docs",
        "[DIR]  plugins",
        "[FILE]  a.txt",
        "[FILE]  demo.svg",
        "[FILE]  package.json",
        "[OTHER]  link"
      ].join("\n")
    );
  });

  it("reports an empty directory and read failures", () => {
    const emptyHost = new PluginHost("/empty", new FakeDirectoryAccess([]));
    emptyHost.activate(dirPlugin);
    expect(output(emptyHost, "dir")).toBe("(empty directory)");

    const failure = new UserError("cannot read directory: /broken");
    const brokenHost = new PluginHost("/broken", new FakeDirectoryAccess([], failure));
    brokenHost.activate(dirPlugin);
    expect(() => output(brokenHost, "dir")).toThrowError("cannot read directory: /broken");
  });

  it("works without a document and does not change document or undo history", () => {
    expect(harness.success("dir").message).toBe("(empty directory)");
    harness.success("init 100 100");
    harness.success("create rect r1 0 0 10 10");
    const before = harness.session.requireDocument().createMemento().createRootClone();
    harness.success("dir");
    expect(harness.session.requireDocument().createMemento().createRootClone().children).toHaveLength(
      before.children.length
    );
    expect(harness.session.history.undoDepth).toBe(1);
    harness.success("undo");
    expect(harness.session.requireDocument().find("r1")).toBeUndefined();
  });

  it("runs against a real filesystem adapter in a fixed temporary directory", () => {
    const directory = mkdtempSync(join(tmpdir(), "dir-plugin-test-"));
    try {
      mkdirSync(join(directory, "docs"));
      writeFileSync(join(directory, "demo.svg"), "<svg/>", "utf8");
      writeFileSync(join(directory, "package.json"), "{}", "utf8");
      const host = new PluginHost(directory);
      host.activate(dirPlugin);
      expect(output(host, "dir")).toBe(
        ["[DIR]  docs", "[FILE]  demo.svg", "[FILE]  package.json"].join("\n")
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("appears in help only when installed", () => {
    expect(harness.success("help").message).toContain("dir");
    const bare = new CommandHarness();
    try {
      expect(bare.run("dir").error).toBe("unknown command: dir (type 'help')");
    } finally {
      bare.dispose();
    }
  });
});
