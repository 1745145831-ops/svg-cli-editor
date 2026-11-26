# 代码指标（自动生成）

> 由 `node scripts/metrics.mjs --base final --head HEAD` 从 git 对象生成；请勿手改本文件。
> 基线 `final` = 609334c，目标 `HEAD` = af8016d。
> p2 标签指向包含本报告的收尾提交；报告按源码树计算，本目录不计入任何一类 LOC/复杂度。

## 口径

- CLI 范围只统计 `src/**/*.ts`，排除测试、`node_modules`、`dist`、文档、配置。
- 行数为非空且非注释行（`//`、`/*`、块注释行）。
- 圈复杂度使用文件级近似值：每个文件从 1 起，`if/for/while/do/case/catch`、条件 `?:`（以 `?` 计）以及 `&&/||/??` 各 +1；先移除注释和字符串字面量再计数。该指标用于比较增量，不等同于严格 McCabe 工具输出。
- 分类：`kernel`（domain/application/infrastructure/shared/kernel）、`assembly`（src/host + src/cli）、`plugin`（src/plugins）。
- VS Code 扩展独立统计，不混入 CLI 重构增量。

## LOC 与圈复杂度

| 类别 | final LOC | HEAD LOC | Δ LOC | final 文件 | HEAD 文件 | final CC | HEAD CC | Δ CC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 内核 kernel | 2662 | 3122 | 460 | 62 | 82 | 416 | 492 | 76 |
| 装配 assembly | 97 | 346 | 249 | 2 | 6 | 15 | 81 | 66 |
| 插件 plugin | 0 | 751 | 751 | 0 | 24 | 0 | 83 | 83 |
| 合计 total | 2759 | 4219 | 1460 | 64 | 112 | 431 | 656 | 225 |

## VS Code 扩展（独立）

| 指标 | 数值 |
|---|---:|
| TypeScript 源文件 | 5 |
| 非空非注释行 | 298 |
| 圈复杂度近似值 | 66 |

## 文件清单

逐文件清单、职责与每文件指标见 [files.md](files.md)，机器可读数据见 [metrics.json](metrics.json)。

最终逐文件清单：112 个 CLI 源文件，其中内核 82、装配 6、插件 24。
