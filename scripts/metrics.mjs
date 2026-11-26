#!/usr/bin/env node
/**
 * Generates docs/metrics from git objects. No numbers in the report are hand
 * written: file counts, code LOC and an AST-based cyclomatic-complexity
 * approximation are derived from the two given refs.
 *
 * Usage: node scripts/metrics.mjs [--base final] [--head HEAD] [--out docs/metrics]
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const argumentsList = process.argv.slice(2);
const argumentValue = (name, fallback) => {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? (argumentsList[index + 1] ?? fallback) : fallback;
};
const baseRef = argumentValue("--base", "final");
const headRef = argumentValue("--head", "HEAD");
const outputDirectory = join(root, argumentValue("--out", "docs/metrics"));

const git = (args) => {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return result.stdout;
};

const roleFor = (path) => {
  const roles = [
    ["src/kernel/plugin/", "扩展点接口、注册表与插件运行时"],
    ["src/kernel/ports/", "内核出站端口与文档事件"],
    ["src/kernel/context/", "命令上下文"],
    ["src/domain/model/", "领域模型与组合树"],
    ["src/domain/command/", "命令模式、Memento 与撤销"],
    ["src/domain/factory/", "SVG 长度归一化"],
    ["src/application/handlers/", "内置命令处理器"],
    ["src/application/display/", "帮助、结构树与详情渲染"],
    ["src/application/", "解析、分发与会话"],
    ["src/infrastructure/svg/", "SVG 读写基础设施适配器"],
    ["src/infrastructure/fs/", "目录访问基础设施适配器"],
    ["src/plugins/builtin-shapes/", "内置图形 ShapeProvider 插件"],
    ["src/plugins/builtin-commands/", "内置命令 Command 插件"],
    ["src/plugins/stats/", "stats 命令插件"],
    ["src/plugins/dir/", "dir 命令插件"],
    ["src/plugins/shape-box/", "box 图形、属性与树标签插件"],
    ["src/plugins/tree-star/", "modified-star 树标签插件"],
    ["src/host/loader/", "配置装配加载器"],
    ["src/host/", "组合根与代码装配"],
    ["src/cli/", "CLI 终端适配器与入口"],
    ["src/shared/", "共享格式化与错误"]
  ];
  return roles.find(([prefix]) => path.startsWith(prefix))?.[1] ?? "核心源码";
};

const categoryFor = (path) => {
  if (path.startsWith("src/plugins/")) {
    return "plugin";
  }
  if (path.startsWith("src/host/") || path.startsWith("src/cli/")) {
    return "assembly";
  }
  return "kernel";
};

const codeLines = (source) =>
  source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^(\/\/|\/\*|\*|\*\/)/u.test(line)).length;

const decisionKeywords = new Set(["if", "for", "while", "do", "case", "catch"]);

/** Removes comments/string literals so keyword counting is not fooled by text. */
const stripLiterals = (source) => {
  let output = "";
  let index = 0;
  while (index < source.length) {
    const character = source[index] ?? "";
    const next = source[index + 1] ?? "";
    if (character === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      index = end < 0 ? source.length : end;
      continue;
    }
    if (character === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      const quote = character;
      index += 1;
      while (index < source.length) {
        const current = source[index] ?? "";
        if (current === "\\") {
          index += 2;
          continue;
        }
        if (current === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      output += " ";
      continue;
    }
    output += character;
    index += 1;
  }
  return output;
};

/**
 * File-level McCabe approximation: 1 + decision tokens (keywords, ?:, &&, ||,
 * ??). The aggregate is sufficient for a before/after repository delta and
 * avoids depending on a specific TypeScript compiler API version.
 */
const cyclomatic = (path, source) => {
  const stripped = stripLiterals(source);
  const tokens = stripped.match(/&&|\|\||\?\?|\?\.|[A-Za-z_$][\w$]*|\?/gu) ?? [];
  let decisions = 0;
  for (const token of tokens) {
    if (decisionKeywords.has(token) || token === "&&" || token === "||" || token === "??") {
      decisions += 1;
    } else if (token === "?") {
      decisions += 1;
    }
  }
  return 1 + decisions;
};

const collect = (ref) => {
  const files = git(["ls-tree", "-r", "--name-only", ref, "--", "src"])
    .split(/\r?\n/u)
    .filter((path) => path.endsWith(".ts"));
  const entries = files.map((path) => {
    const source = git(["show", `${ref}:${path}`]);
    const classes = [...source.matchAll(/export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/gu)]
      .map((match) => match[1]);
    return {
      path,
      category: categoryFor(path),
      loc: codeLines(source),
      complexity: cyclomatic(path, source),
      classes,
      role: roleFor(path)
    };
  });
  return entries;
};

const summarize = (entries) => {
  const result = {
    kernel: { files: 0, loc: 0, complexity: 0 },
    assembly: { files: 0, loc: 0, complexity: 0 },
    plugin: { files: 0, loc: 0, complexity: 0 },
    total: { files: 0, loc: 0, complexity: 0 }
  };
  for (const entry of entries) {
    result[entry.category].files += 1;
    result[entry.category].loc += entry.loc;
    result[entry.category].complexity += entry.complexity;
    result.total.files += 1;
    result.total.loc += entry.loc;
    result.total.complexity += entry.complexity;
  }
  return result;
};

const collectVsCode = (ref) => {
  const files = git(["ls-tree", "-r", "--name-only", ref, "--", "vscode-extension/src"])
    .split(/\r?\n/u)
    .filter((path) => path.endsWith(".ts"));
  let loc = 0;
  let complexity = 0;
  const entries = files.map((path) => {
    const source = git(["show", `${ref}:${path}`]);
    const fileLoc = codeLines(source);
    const fileComplexity = cyclomatic(path, source);
    loc += fileLoc;
    complexity += fileComplexity;
    return { path, loc: fileLoc, complexity: fileComplexity };
  });
  return { files: entries.length, loc, complexity, entries };
};

const baseEntries = collect(baseRef);
const headEntries = collect(headRef);
const base = summarize(baseEntries);
const head = summarize(headEntries);
const vscode = collectVsCode(headRef);
const baseHash = git(["rev-parse", "--short", `${baseRef}^{commit}`]).trim();
const headHash = git(["rev-parse", "--short", `${headRef}^{commit}`]).trim();

const row = (label, key) => {
  const b = base[key];
  const h = head[key];
  return `| ${label} | ${b.loc} | ${h.loc} | ${h.loc - b.loc} | ${b.files} | ${h.files} | ${b.complexity} | ${h.complexity} | ${h.complexity - b.complexity} |`;
};

const summary = `# 代码指标（自动生成）

> 由 \`node scripts/metrics.mjs --base ${baseRef} --head ${headRef}\` 从 git 对象生成；请勿手改本文件。
> 基线 \`${baseRef}\` = ${baseHash}，目标 \`${headRef}\` = ${headHash}。
> p2 标签指向包含本报告的收尾提交；报告按源码树计算，本目录不计入任何一类 LOC/复杂度。

## 口径

- CLI 范围只统计 \`src/**/*.ts\`，排除测试、\`node_modules\`、\`dist\`、文档、配置。
- 行数为非空且非注释行（\`//\`、\`/*\`、块注释行）。
- 圈复杂度使用文件级近似值：每个文件从 1 起，\`if/for/while/do/case/catch\`、条件 \`?:\`（以 \`?\` 计）以及 \`&&/||/??\` 各 +1；先移除注释和字符串字面量再计数。该指标用于比较增量，不等同于严格 McCabe 工具输出。
- 分类：\`kernel\`（domain/application/infrastructure/shared/kernel）、\`assembly\`（src/host + src/cli）、\`plugin\`（src/plugins）。
- VS Code 扩展独立统计，不混入 CLI 重构增量。

## LOC 与圈复杂度

| 类别 | ${baseRef} LOC | ${headRef} LOC | Δ LOC | ${baseRef} 文件 | ${headRef} 文件 | ${baseRef} CC | ${headRef} CC | Δ CC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${row("内核 kernel", "kernel")}
${row("装配 assembly", "assembly")}
${row("插件 plugin", "plugin")}
${row("合计 total", "total")}

## VS Code 扩展（独立）

| 指标 | 数值 |
|---|---:|
| TypeScript 源文件 | ${vscode.files} |
| 非空非注释行 | ${vscode.loc} |
| 圈复杂度近似值 | ${vscode.complexity} |

## 文件清单

逐文件清单、职责与每文件指标见 [files.md](files.md)，机器可读数据见 [metrics.json](metrics.json)。

最终逐文件清单：${headEntries.length} 个 CLI 源文件，其中内核 ${head.kernel.files}、装配 ${head.assembly.files}、插件 ${head.plugin.files}。
`;

const fileRows = headEntries
  .map(
    (entry) =>
      `| \`${entry.path}\` | ${entry.category} | ${entry.loc} | ${entry.complexity} | ${entry.classes.join(", ") || "—"} | ${entry.role} |`
  )
  .join("\n");

const files = `# p2 文件清单与职责（自动生成）

> 由 \`scripts/metrics.mjs\` 生成；基线 \`${baseRef}\` (${baseHash})，目标 \`${headRef}\` (${headHash})。
> 行数为非空非注释行；CC 为文件级决策点近似值（1 + 决策点）。

| 文件 | 类别 | LOC | CC | 导出的类 | 职责 |
|---|---|---:|---:|---|---|
${fileRows}

## VS Code 扩展（独立）

| 文件 | LOC | CC |
|---|---:|---:|
${vscode.entries
  .map((entry) => `| \`${entry.path}\` | ${entry.loc} | ${entry.complexity} |`)
  .join("\n")}
`;

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, "summary.md"), summary, "utf8");
writeFileSync(join(outputDirectory, "files.md"), files, "utf8");
writeFileSync(
  join(outputDirectory, "metrics.json"),
  `${JSON.stringify(
    {
      base: { ref: baseRef, commit: baseHash, summary: base },
      head: { ref: headRef, commit: headHash, summary: head },
      vscode,
      files: headEntries
    },
    null,
    2
  )}\n`,
  "utf8"
);
console.log(
  `metrics: ${baseRef}(${baseHash}) -> ${headRef}(${headHash}); ` +
    `LOC ${base.total.loc} -> ${head.total.loc}; ` +
    `CC ${base.total.complexity} -> ${head.total.complexity}`
);
