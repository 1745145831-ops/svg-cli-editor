#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "src");

const allowedLayers = {
  shared: new Set(["shared"]),
  domain: new Set(["domain", "shared"]),
  application: new Set(["application", "domain", "shared"]),
  infrastructure: new Set(["infrastructure", "application", "domain", "shared"]),
  cli: new Set(["cli", "application", "infrastructure", "domain", "shared"])
};

const errors = [];
const files = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(path);
    } else if (extname(entry.name) === ".ts") {
      files.push(path);
    }
  }
}

function layerOf(path) {
  return relative(sourceRoot, path).split(sep)[0];
}

walk(sourceRoot);

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const fileLayer = layerOf(file);
  const display = relative(root, file);
  const importSpecifiers = [
    ...source.matchAll(/\bfrom\s+["']([^"']+)["']/gu),
    ...source.matchAll(/\bimport\s+["']([^"']+)["']/gu),
    ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/gu)
  ].map((match) => match[1]);

  if (fileLayer === "domain" || fileLayer === "application" || fileLayer === "shared") {
    for (const specifier of importSpecifiers) {
      if (!specifier.startsWith(".")) {
        errors.push(`${display}: ${fileLayer} may not import external module '${specifier}'`);
      }
    }
  }

  for (const specifier of importSpecifiers) {
    if (!specifier.startsWith(".")) {
      continue;
    }
    const target = resolve(dirname(file), specifier);
    const targetRelative = relative(sourceRoot, target);
    if (targetRelative.startsWith("..")) {
      errors.push(`${display}: import leaves src/: ${specifier}`);
      continue;
    }
    const targetLayer = targetRelative.split(sep)[0];
    const allowed = allowedLayers[fileLayer];
    if (allowed === undefined) {
      errors.push(`${display}: unknown source layer '${fileLayer}'`);
    } else if (!allowed.has(targetLayer)) {
      errors.push(`${display}: ${fileLayer} -> ${targetLayer} is forbidden (${specifier})`);
    } else if (
      fileLayer === "infrastructure" &&
      targetLayer === "application" &&
      !targetRelative.startsWith(`application${sep}gateway${sep}`)
    ) {
      errors.push(
        `${display}: infrastructure may only use application/gateway ports (${specifier})`
      );
    }
  }

  const classNames = [
    ...source.matchAll(/^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/gmu)
  ].map((match) => match[1]);
  if (classNames.length > 1) {
    errors.push(`${display}: contains ${classNames.length} classes; use one class per file`);
  } else if (classNames.length === 1) {
    const basename = file.slice(file.lastIndexOf(sep) + 1, -3);
    if (classNames[0] !== basename) {
      errors.push(`${display}: class '${classNames[0]}' must match file name '${basename}'`);
    }
  }
}

if (errors.length > 0) {
  console.error("Architecture check failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Architecture check passed (${files.length} TypeScript source files).`);
}
