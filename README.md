# SVG CLI Editor + VS Code 扩展

PJ1 Phase 2：在 Phase 1 的 CLI SVG 编辑器基础上，实践 VS Code 插件开发与插件式重构。仓库同时包含：

- 一个可运行的 VS Code 扩展：Explorer 中给 `.svg` 文件加 `[]` 标记，原生 Outline 展示 SVG 元素层级并支持点击定位；
- 一个四扩展点（`ShapeProvider`、`Command`、`TreeDecorator`、`AttributeHandler`）的 CLI 插件框架；
- 新增的 `stats`、`dir`、`box`、`modified-star` / `(box)` 插件，以及代码装配与配置装配两种装载方式。

![VS Code SVG 标记](doc/images/vscode-svg-badge.png)

## 快速开始

要求 Node.js 20+。

```bash
npm install
npm run build:cli
npm run cli          # 源码模式：方式 A
npm start            # 编译产物模式：方式 A
npm start -- --config plugins.config.json   # 方式 B
```

默认装配启用本阶段四个可选插件。要运行 Phase 1 基线：

```bash
npm start -- --config plugins.phase1.json
```

### 常用命令

| 类别 | 命令 |
|---|---|
| 文档 | `init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w] [h]` |
| 图形 | `create <type> <id> [params…] [in <gid>]`、`delete`、`move`、`scale`、`set` |
| 结构 | `group`、`ungroup`、`addto`、`front`、`back`、`tree [id]`、`show <id>` |
| 历史 | `undo`、`redo` |
| Phase 2 插件 | `stats`、`dir`、`create box <id> <x> <y> <w> <h> "label"` |
| 其他 | `help`、`quit` / `exit` |

树标签由插件提供：

```text
svg (800x600) *
└── g#n1 (box) *
    ├── rect#n1-rect   x=520 y=100 w=160 h=60 fill=#f5a623 *
    └── text#n1-label  (540,135) "处理数据 v2" *
```

### VS Code 扩展

```bash
npm run build:vscode
code --extensionDevelopmentPath=<repo>/vscode-extension <repo>/vscode-extension/sample-workspace
```

打开 `sample-workspace/example.svg` 的文本编辑器，打开 Explorer 和 Outline。示例工作区还包含 `notes.txt`、`docs/` 与一个不完整 XML 的 `broken.svg`，用于对照文件标记和异常输入。

## 质量检查

```bash
npm run check          # 类型检查 + 架构依赖检查 + 测试 + 扩展打包
npm run test:coverage
npm run verify:compat  # Phase 1 输出对照
npm run verify:assembly # A/B 双装配逐字节一致
npm run metrics        # 生成 docs/metrics/
```

当前测试：104 个（CLI、插件、加载器、VSCode 解析器）。

## 文档

完整设计、扩展点清单、ADR、两种装配方式、VSCode 模式分析与验证材料见 **[doc/README.md](doc/README.md)**。

自动生成指标见 **[docs/metrics/summary.md](docs/metrics/summary.md)**。
