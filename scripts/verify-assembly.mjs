#!/usr/bin/env node
/**
 * Replays one input session through code assembly (A) and config assembly (B)
 * in two byte-identical fixed working directories and compares the output.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist", "cli", "main.js");
if (!readFileSync(join(root, "package.json"), "utf8").includes("svg-cli-editor")) {
  throw new Error("run from the repository root");
}
const input = readFileSync(join(root, "doc", "transcript", "cli-2.txt"), "utf8");
const config = join(root, "plugins.config.json");

const makeWorkdir = () => {
  const directory = mkdtempSync(join(tmpdir(), "svg-assembly-"));
  mkdirSync(join(directory, "docs"));
  mkdirSync(join(directory, "plugins"));
  writeFileSync(join(directory, "demo.svg"), "<svg/>\n", "utf8");
  writeFileSync(join(directory, "package.json"), "{}\n", "utf8");
  writeFileSync(join(directory, ".hidden"), "hidden\n", "utf8");
  writeFileSync(join(directory, "docs", "guide.txt"), "guide\n", "utf8");
  writeFileSync(join(directory, "plugins", "readme.txt"), "plugins\n", "utf8");
  return directory;
};

const run = (directory, extraArguments) => {
  const result = spawnSync(process.execPath, [cli, ...extraArguments], {
    cwd: directory,
    input,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`CLI failed in ${directory}: ${result.stderr}`);
  }
  return result.stdout + result.stderr;
};

const directoryA = makeWorkdir();
const directoryB = makeWorkdir();
try {
  const a = run(directoryA, []);
  const b = run(directoryB, ["--config", config]);
  writeFileSync(join(root, "doc", "transcript", "cli-2-code.txt"), a, "utf8");
  writeFileSync(join(root, "doc", "transcript", "cli-2-config.txt"), b, "utf8");
  if (a !== b) {
    let index = 0;
    while (index < a.length && index < b.length && a[index] === b[index]) {
      index += 1;
    }
    throw new Error(
      `code/config outputs differ at character ${index}:\nA=${JSON.stringify(a.slice(index, index + 80))}\nB=${JSON.stringify(b.slice(index, index + 80))}`
    );
  }
  console.log(`A/B identical: ${Buffer.byteLength(a)} bytes, ${a.split("\n").length} lines`);
} finally {
  rmSync(directoryA, { recursive: true, force: true });
  rmSync(directoryB, { recursive: true, force: true });
}
