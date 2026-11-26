#!/usr/bin/env node
/**
 * Compares the current built-ins-only assembly with the checked-in transcript
 * produced by tag `final`. The transcript is generated once from a clean
 * worktree of `final` (documented in doc/README.md); no worktree/node_modules
 * junction is created here, so the repository dependencies cannot be touched.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist", "cli", "main.js");
const input = readFileSync(join(root, "doc", "transcript", "cli-1.txt"), "utf8");
const expected = readFileSync(join(root, "doc", "transcript", "cli-1-final.txt"), "utf8");
const directory = mkdtempSync(join(tmpdir(), "svg-compat-"));

try {
  const result = spawnSync(
    process.execPath,
    [cli, "--config", join(root, "plugins.phase1.json")],
    { cwd: directory, input, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`Phase 2 CLI failed:\n${result.stderr}`);
  }
  const actual = result.stdout + result.stderr;
  writeFileSync(
    join(root, "doc", "transcript", "cli-1-phase2-builtins.txt"),
    actual,
    "utf8"
  );
  if (actual !== expected) {
    throw new Error("Phase 1 compatibility output differs from tag final transcript");
  }
  console.log(`Phase 1 compatibility identical: ${Buffer.byteLength(actual)} bytes`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
