# PJ1 Phase 1：CLI SVG 编辑器——架构与过程文档

> 代码仓库根目录：本工程。最终提交标签：`final`。
> 本文档覆盖作业要求的四部分：**架构方案、过程记录、一致性自查、质量保证手段**。

![最终流程图渲染截图](flowchart.png)

上图由本项目的 CLI 命令生成 `examples/flowchart.svg` 后用浏览器渲染截图，验证了“命令 → SVG 文件 → 浏览器预览”的完整链路。

## 0. 项目一览

| 项 | 内容 |
|---|---|
| 语言/运行环境 | TypeScript 7、Node.js 20+ |
| 交互方式 | `svg>` 行式 REPL，支持 `#` 注释与双引号参数 |
| 构建/运行 | `npm run cli`（tsx）；`npm run build` + `npm start`（dist） |
| 质量门禁 | `npm run check` = 类型检查 + 依赖规则检查 + 全量测试 |
| 内置图形 | `rect`、`circle`、`ellipse`、`line`、`text`、`g` |
| 阶段边界 | `box` 属于后续插件化阶段，本阶段按规范报 `unknown shape type` |

---

## 1. 架构方案

### 1.1 设计目标与约束

作业的核心不是“把命令跑通”，而是展示一个**可演进、依赖方向清晰、恰当使用设计模式**的 CLI 应用。因此代码遵守以下硬约束：

1. TypeScript + 面向对象：`Shape` 是抽象类，六种图形各自成类；几何字段私有，操作通过多态方法完成。
2. 一类一文件，文件名 = 类名；不写贫血数据袋，不用自由函数实现命令逻辑。
3. 必须使用 **Command 模式**；`undo`/`redo` 以一条编辑命令为一个单位。
4. 按名字分派只保留两个集中点：`CommandDispatcher`（命令名 → handler）和 `ShapeFactory`（类型名 → 类），并在本文档与代码中标记为后续可重构项。
5. 容器与叶子统一操作：`move` / `scale` / `set` / `delete` 等不因 `<g>` 与叶子而出现两套命令路径，体现 Composite 语义。
6. I/O 与领域模型隔离：领域层不出现 `fs`、`readline`、`process`。

### 1.2 模块划分与职责

| 目录 | 职责 | 关键类型 |
|---|---|---|
| `src/domain/model/` | 图形实体、组合树、文档聚合根、快照。几何数据与结构变更规则都在这里 | `Shape`、六个叶子类、`GroupShape`、`SvgDocument`、`DocumentMemento` |
| `src/domain/command/` | 编辑命令与历史栈。命令只依赖文档模型 | `EditorCommand`、`EditCommand`、九类具体命令、`UndoManager` |
| `src/domain/factory/` | **唯一的图形类型名分派点**，同时服务 CLI 的 `create` 和 SVG 导入 | `ShapeFactory` |
| `src/application/` | 命令解析/分发、会话状态、每个命令的处理器、展示格式、持久化端口 | `CommandParser`、`CommandDispatcher`、`EditorSession`、`*CommandHandler`、`SvgDocumentGateway` |
| `src/application/display/` | `tree` / `show` / `help` 的纯展示逻辑 | `TreeRenderer`、`ShapeDetailsFormatter`、`HelpText` |
| `src/infrastructure/svg/` | SVG 文件读取、XML DOM 解析、确定性序列化、原子写入 | `SvgDocumentReader`、`SvgDocumentWriter`、`FileSvgGateway` |
| `src/cli/` | 进程入口、REPL、提示符、错误前缀和组合根 | `CliApplication`、`main` |
| `src/shared/` | 无业务依赖的基础能力 | `UserError`、`NumberFormat`、`AttributeDisplay` |
| `scripts/` | 可执行的架构约束检查 | `check-architecture.mjs` |
| `tests/` | 单元、命令集成、CLI、IO 回归测试 | 7 个测试文件 |

### 1.3 组件图

![架构组件图](architecture.png)

PlantUML 源文件：[architecture.puml](architecture.puml)。重新生成：

```bash
java -jar plantuml.jar -tpng doc/architecture.puml
```

图中依赖方向即允许的编译期依赖；`FileSvgGateway` 以虚线实现 `SvgDocumentGateway` 端口，表示基础设施是应用端口的适配器，而不是应用层依赖基础设施。

### 1.4 设计模式及落地位置

#### （1）Command：所有编辑操作的对象化

- `EditorCommand` 定义 `execute / undo / redo` 三个操作；
- 九类具体命令：`CreateShapeCommand`、`DeleteShapeCommand`、`MoveShapeCommand`、`ScaleShapeCommand`、`SetAttributeCommand`、`GroupShapesCommand`、`UngroupShapeCommand`、`AddToContainerCommand`、`ReorderShapeCommand`；
- `UndoManager` 只持有 `EditorCommand[]`，不关心具体命令如何修改树；
- handler 把 CLI 参数翻译为命令对象，然后交给 `EditorSession.executeEdit()`；显示类命令直接返回文本，不进入历史栈。

这样做的直接收益是：`group g r1 c1 t1` 是**一个**命令对象，undo 一次即整体还原，而不是由 handler 依次调用三次模型方法并试图拼回逆操作。

#### （2）Memento：一条命令 = 一份前后快照

`EditCommand` 用模板方法固定执行骨架：

```text
validate() → 创建 before 快照 → apply() → 创建 after 快照
```

- 校验全部在修改前完成；`apply()` 抛异常时用 `before` 恢复，保证“命令失败不改变状态”；
- `undo()` 恢复 `before`，`redo()` 恢复 `after`；
- `DocumentMemento` 保存画布尺寸和整棵形状树的深拷贝，且每次恢复都会再次 clone，因此同一快照可以被反复 undo/redo 而不被污染。

选择快照而不是为每个命令手写逆操作，是因为 group/ungroup/delete/addto 会同时改变父容器、兄弟顺序和 id 索引，手写逆操作极易漏状态。代价是每条历史记录占用 O(n) 内存；本阶段文档规模小，这个代价可接受。若未来文档变大，可只替换 `EditCommand` 的存储策略（如命令逆向或 structural diff），上层不变。

#### （3）Composite：容器与叶子统一操作

- `Shape` 是抽象根，`GroupShape` 是组合节点；
- `GroupShape.moveBy()` / `scaleBy()` 递归子节点，叶子类分别更新自身的几何字段；
- 删除容器由 `SvgDocument.remove()` 统一递归取消索引；
- `group` / `ungroup` 不塞进 `Shape` 作为布尔开关，而是独立的 `Command`，避免模型类承担“把自己从父节点摘出”的上下文职责。

#### （4）Factory：唯一图形类型分派点

`ShapeFactory` 同时提供：

- `createFromCreateArgs(type, id, args)`：CLI 创建；
- `createFromSvgElement(tag, id, attrs, text)`：SVG 导入；
- `isSupportedSvgTag()` / `isContainerTag()`：给读取器做结构判断。

读取器不写第二套 `switch(tag)`，而是复用同一个工厂；CLI handler 也不负责构造图形。这个类已标注 `TODO(refactor): replace with ShapeProvider registry`，对应后续 `box` 插件阶段。

#### （5）Adapter / Port：I/O 隔离

`application/gateway/SvgDocumentGateway` 定义读、写两个用例接口；`FileSvgGateway` 实现它并组合 `SvgDocumentReader` / `SvgDocumentWriter`。`SaveCommandHandler` 只依赖端口，因此领域层与命令处理器完全不知道 Node 文件系统。

#### （6）Template Method / Facade

- `EditCommand` 是 Template Method（固定 validate → snapshot → apply → snapshot）；
- `EditorSession` 是小 Facade：集中管理当前文档、当前路径、撤销栈和 I/O 屏障，CLI 无需自己拼接这些状态。

### 1.5 依赖方向规则

| 模块 | 允许依赖 | 理由 |
|---|---|---|
| `shared` | `shared` | 最底层通用能力，不反向依赖业务 |
| `domain` | `domain`、`shared` | 领域模型必须可独立测试，不能碰 UI/IO |
| `application` | `application`、`domain`、`shared` | 用例编排只表达业务，不依赖具体存储 |
| `infrastructure` | `infrastructure`、`application/gateway`、`domain`、`shared` | 适配器实现应用端口；只允许依赖 `gateway` 子目录，不依赖 handler/session |
| `cli` | 任意源码模块 | 组合根负责把实现注入端口 |

关键判断：

- **`domain` 不依赖 `application`/`infrastructure`/`cli`**：保持领域可独立演进；
- **`application` 不依赖 `infrastructure`**：保存路径、文件格式变化不影响命令处理器；
- **`infrastructure → application/gateway` 是唯一向上依赖**：这是端口-适配器模式的方向，属于有意设计并在检查脚本中放行；
- **`cli` 可以依赖所有层**：它是组合根，也是唯一允许直接创建 `FileSvgGateway` 的地方。

这些规则由 [`scripts/check-architecture.mjs`](../scripts/check-architecture.mjs) 在 `npm run check:arch` 中自动检查，违反即构建失败。

### 1.6 变化点假设

| # | 未来最可能的变化 | 当前预留 / 处理 | 为什么现在不做更多 |
|---|---|---|---|
| 1 | 新增图形类型（`box`、`polygon`、插件） | `ShapeFactory` 是唯一分派点，创建和导入共用；接口预留了 `isSupportedSvgTag` 等判断 | 本阶段明确不要求插件；提前定义 `ShapeProvider` 会变成无使用者的抽象 |
| 2 | 更复杂的 SVG（transform、CSS、命名空间、path） | 读写隔离在 `infrastructure/svg`；未知属性原样保存在 `Shape.extraAttributeEntries`，round-trip 不丢 | 完整 transform 语义需要仿射矩阵/渲染等价，超出 Phase 1；当前保留数据但不解释 |
| 3 | 撤销内存/粒度变化 | `EditorCommand` 与 `UndoManager` 解耦；Memento 可替换为 diff/逆命令 | 当前规模下整树快照最可靠；提前优化会增加错误面 |
| 4 | 从 id 寻址改为结构路径（XPath 风格） | 所有命令只调用 `SvgDocument.find(id)`，寻址集中在聚合根 | 规范明确本阶段只要求 id；DOM 路径解析现在没有收益 |
| 5 | 新增 Web/Agent 通道 | `CliApplication` 只负责 I/O、prompt、错误前缀；会话、命令、展示逻辑均可复用 | 本阶段只要求 CLI；抽出通用 transport 层会是过度设计 |
| 6 | 容器操作从“改子孙坐标”改为 transform 矩阵 | Composite 的 `moveBy/scaleBy` 多态方法已经把差异封在容器/叶子类内 | `scale` 规范明确要求递归乘几何属性；与当前实现一致 |
| 7 | 增加公共属性/样式能力 | 属性白名单在 `Shape`，展示与序列化通过 `getSvgAttributes()` / `presentationEntries` 统一 | 本阶段只要求 fill/stroke/stroke-width 和几何属性 |
| 8 | 自动保存、恢复、文件历史 | `FileSvgGateway` 后面可以替换为带备份/版本控制的实现 | 不属于命令总表；把文件策略放进领域会污染模型 |

### 1.7 关键取舍

1. **层级选择：命令放 domain，不放 application。** 命令只操作 `SvgDocument`，不依赖 CLI；放入 domain 可以让 `application` 和测试直接复用，也符合“application → domain”的单向依赖。
2. **错误处理：业务可预期错误统一 `UserError`**，CLI 加 `error:` 前缀；未预期异常显示 `internal error`，但命令的 try/catch 会先恢复快照，避免半修改状态。
3. **容器移动/缩放采用递归改几何，而不是新增 transform 属性。** 这与规范“scale 同乘到全部几何属性、容器递归到每个子孙”一致，也让 `tree` 能直接显示真实坐标；代价是对带外部 transform 的导入文档只保留原属性，不重新计算可视化等价。
4. **I/O 屏障是显式状态，不靠清空栈“假装”禁止。** `UndoManager.blocked` 让 `undo` 与 `redo` 都返回规范要求的 `undo not allowed after io command`，直到下一条编辑命令 `record()` 解除。

---

## 2. 过程记录

### 2.1 与 AI 的协作方式

本项目按“**AI 生成候选实现 → 人对照规范审查 → 运行验证 → 修正并留下测试**”的循环推进。AI 主要承担：

- 把命令总表拆成命令类、handler 和错误信息清单；
- 生成首版类图、测试骨架、文档草稿；
- 对边界输入提出反例（例如 `group` 祖先检查、同一快照多次恢复、`in` 子句歧义）；
- 在实现后做一次独立的“按规范逐条审计”。

人负责最终判断：每条建议都要能对应到规范条款、可运行测试或明确的阶段边界，才被接受。下面的过程记录保留了几次有代表性的分歧和修正，而不是只记录“最后能跑”。

### 2.2 关键迭代

| 轮次 | 讨论/发现 | 决策与修正 | 验证 |
|---|---|---|---|
| 1 | AI 初版提议用一个 `EditorService` 加大量 `switch (commandName)` / `switch (tag)` 快速完成 | 否决。命令用 Command 对象，命令名分派收进 `CommandDispatcher`，类型分派收进 `ShapeFactory` | `npm run check:arch` 检查依赖；代码审查只保留两个分派点 |
| 2 | 是否让每个具体命令手写逆操作 | 否决。`group`/`ungroup`/`delete` 涉及多父节点和顺序恢复，改用 `EditCommand` + `DocumentMemento` 的前后快照；`apply` 抛错时自动恢复 | `editing.test.ts` 的 undo/redo 全链路测试；模型重复恢复测试 |
| 3 | SVG 导入解析器选择 | 比较按标签聚合的对象解析与 DOM 遍历，选择 DOM 遍历，因为必须保留子节点文档顺序；先扫一遍收集显式 id，再按标签生成 `rect1`、`g1` 等 | `svg-io.test.ts` 的顺序、缺 id 警告、重复 id 用例 |
| 4 | 手工跑 `ungroup node2` 时出现 `error: id already exists: process` | 定位为：先摘子节点、后删容器，子节点 id 仍在索引里，重新 `attach` 被视为重复。改为先删除整个容器的索引，再提升子节点；补回归测试 | 手工 transcript + `ungroup` 测试（undo/redo 均通过） |
| 5 | `create text t 1 2 "in"` 的内容恰好是 `in`，可能被误判为 `in <container>` 子句 | handler 解 `in` 时增加类型感知例外：`text` 的第三个参数就是内容时不当子句；同时测试“内容 in + 真正容器” | `editing.test.ts` 的六类型测试、解析测试 |
| 6 | 保存失败/读取失败是否应该清空 undo 栈 | 不应该。只有**成功**的 I/O 才开启新纪元；失败命令必须保持文档与历史不变 | `history-io.test.ts` 的失败 save/read 测试 |
| 7 | 规范说 I/O 后“直到下一次编辑命令重新解禁”，只清空栈不够表达 | `UndoManager` 增加 `blocked` 标志；`undo`/`redo` 在 blocked 时返回统一错误；下一次 `record()` 解禁 | `history-io.test.ts` 覆盖 init/read/save/canvas 四种屏障 |
| 8 | XML 解析错误可能带换行，违反“error 一行一条” | `CliApplication` 对 warning/error 做单行化，保留内容但折叠换行 | `cli-application.test.ts` 的解析错误用例；手工 malformed XML |
| 9 | `init` / `canvas` 只给一个参数时的语义规范未明确 | 选择“宽度给定、高度沿用默认/当前值”，不拒绝单参数；文档和测试明确这一行为 | `history-io.test.ts` 的单参数用例 |

### 2.3 有代表性的 AI 建议审查

| AI 建议 | 是否采纳 | 理由 |
|---|---|---|
| 用 Memento 统一 undo/redo | 采纳 | 多父节点结构操作恢复精确；失败可原子回滚 |
| 用 `switch(command)` 做 CLI 分发 | 不采纳 | 违反“按名字分派只允许两处”的约束，改为表驱动 dispatcher + 一命令一 handler |
| 用 `group` 的 transform 属性实现 move/scale | 不采纳 | 规范明确 scale 要乘几何属性，且容器递归；改子节点坐标与 tree/show 语义一致 |
| 读取时忽略所有未知元素 | 部分采纳 | 忽略 `title/desc/metadata/defs/style/script`，但对 `path` 等可见图形报 `unsupported SVG element`，避免静默丢图 |
| 每个命令直接写反向操作 | 不采纳 | group/ungroup/delete 的父节点、顺序、索引状态组合过多，测试成本高 |
| 让 `save` 失败也重置撤销栈 | 不采纳 | 命令失败不应改变状态；测试明确断言失败后仍可 undo |
| 把 undo 屏障只实现为“清空栈” | 不采纳 | 清空后 `undo` 会报 `nothing to undo`，不符合规范要求的 `undo not allowed after io command` |
| 为所有未来插件预建 `ShapeProvider` 接口 | 不采纳 | Phase 1 不需要；保留工厂集中点并标记 TODO 更符合“不要过度设计” |

### 2.4 我是如何核验 AI 产出的

1. **规范逐条映射**：把命令表、错误表、显示格式、撤销粒度逐条写成测试或手工 transcript；发现“容器移动到自身后代”“top-level ungroup”“scale 0”等容易漏的边界。
2. **实际运行而非只看代码**：每条关键命令通过 `npm run cli` 的实际 stdin/stdout 跑一遍，包括中文文本、引号、`#` 填色、缺少 id 的外部 SVG。
3. **观测文件产物**：用浏览器打开 `examples/flowchart.svg`，截图见文档顶部；检查保存文件确实能被浏览器渲染。
4. **独立审计**：实现完成后让 AI 按规范做一次只读审计，人工逐条复核它指出的问题；能复现的用测试固定，不能复现的说明为已知边界。
5. **质量门禁**：类型检查、依赖检查、49 个测试、构建后运行四个命令都通过后才打 tag。

---

## 3. 一致性自查

### 3.1 模块划分是否与方案一致？

**结论：一致，无未记录的模块偏差。**

实际目录与 1.2 节表格逐项对应：

```text
src/
  domain/
    model/          Shape 及六个叶子、GroupShape、SvgDocument、DocumentMemento
    command/        EditorCommand、EditCommand、九类命令、UndoManager、CommandResult
    factory/        ShapeFactory
  application/
    display/        TreeRenderer、ShapeDetailsFormatter、HelpText
    gateway/        SvgDocumentGateway 端口、SvgReadResult
    handlers/       一命令一 handler、CommandContext、ArgumentCheck
    CommandParser / LineTokenizer / CommandDispatcher / EditorSession / ParsedCommand
  infrastructure/svg/
    SvgDocumentReader / SvgDocumentWriter / FileSvgGateway
  cli/
    CliApplication / main
  shared/
    UserError / NumberFormat / AttributeDisplay
```

实现期间发生的方案级调整（均已在本文档记录，不构成“偷偷改目录”）：

| 修订 | 内容 | 原因 |
|---|---|---|
| R1 | `SvgDocumentGateway` 端口放在 `application/gateway`，适配器放 `infrastructure` | 端口-适配器方向；`infra -> application/gateway` 在依赖规则中显式放行 |
| R2 | `ShapeFactory` 放在 `domain/factory` 而非 application | CLI `create` 与 SVG 读取都要用，避免在读取器复制类型分派 |
| R3 | 增加 `scripts/check-architecture.mjs` | 让“依赖方向”从文档约定变成可执行门禁，属于工程支撑，不是业务模块 |
| R4 | `init` / `canvas` 单参数语义明确为“宽度 + 默认/当前高度” | 规范只写 `[w] [h]`，用测试固定一种合理行为 |

### 3.2 依赖方向有没有被违反？

**结论：没有。**

自动检查结果：

```text
> svg-cli-editor@0.1.0 check:arch
> node scripts/check-architecture.mjs

Architecture check passed (63 TypeScript source files).
```

抽样人工核对（与检查脚本一致）：

- `src/domain/model/Shape.ts` 只 import `shared` 与自身类型，无 Node/应用依赖；
- `src/domain/command/*.ts` 只 import `domain` 与 `shared`；
- `src/application/EditorSession.ts` import `domain` 与 `shared`，不 import `fs`/`infrastructure`；
- `src/infrastructure/svg/FileSvgGateway.ts` 只 import `application/gateway`、domain 与同层 reader/writer；
- 只有 `src/cli/main.ts` 同时 import application、infrastructure 并完成注入。

检查脚本还同时执行“一类一文件、类名 = 文件名”的静态扫描；当前 63 个 `src/**/*.ts` 全部通过。检查规则本身在 `scripts/check-architecture.mjs`，不是一次性手工结论。

### 3.3 可复现的一致性检查

```bash
npm run check:arch
npm run typecheck
npm test
```

### 3.4 一致性检查中发现的问题

审计阶段没有发现目录或依赖违规；发现并修复的是**行为**问题（见 2.2 的 ungroup 索引、I/O 屏障、错误换行）。这些都已加入回归测试，不在本文档里留成“待处理项”。

---

## 4. 功能完整性与质量保证

### 4.1 功能矩阵（对照命令总表）

| 类别 | 命令 | 状态 | 主要验证 |
|---|---|---|---|
| 文档 | `init [w] [h]` | ✅ 默认 800×600；单参数宽度 | `history-io.test.ts` |
| 文档 | `read <file.svg>` | ✅ 六类型 + g；缺 id 警告；重复 id/坏 XML 报错且不替换文档 | `svg-io.test.ts` |
| 文档 | `save [file.svg]` | ✅ 默认读入路径；原子写；元素计数 | `svg-io.test.ts`、手工 |
| 文档 | `canvas [w] [h]` | ✅ 显示/修改；修改进入 I/O 屏障 | `history-io.test.ts` |
| 编辑 | `create <type> <id> […] [in <gid>]` | ✅ 六类型、可选 fill/stroke、`in` 嵌套 | `editing.test.ts` |
| 编辑 | `delete <id>` | ✅ 容器连同子孙；一次 undo 恢复 | `editing.test.ts` |
| 编辑 | `move <id> <dx> <dy>` | ✅ 叶子/容器递归；undo 回原位 | `editing.test.ts` |
| 编辑 | `scale <id> <factor>` | ✅ 全部几何属性；容器递归；非正数报错 | `editing.test.ts`、`model.test.ts` |
| 编辑 | `set <id> <attr> <value>` | ✅ fill/stroke/stroke-width、几何、text；白名单外报错 | `editing.test.ts` |
| 编辑 | `group <newGid> <ids…>` | ✅ 收入已存在图形、保持顺序、祖先检测 | `editing.test.ts` |
| 编辑 | `ungroup <gid>` | ✅ 子节点原位提升；top-level 拒绝；undo 还原 | `editing.test.ts` |
| 编辑 | `addto <gid> <id>` | ✅ 移动归属、尾插；undo 回原父 | `editing.test.ts` |
| 编辑 | `front <id>` / `back <id>` | ✅ 同级 z-order；undo 回原位置 | `editing.test.ts` |
| 显示 | `tree [id]` | ✅ 根/子树、内联几何、缩进对齐 | `display.test.ts` |
| 显示 | `show <id>` | ✅ 父节点、几何、文本、公共属性、保留属性 | `display.test.ts` |
| 显示 | `help` | ✅ 全部命令与语法 | `display.test.ts` |
| 历史 | `undo` / `redo` | ✅ 一命令一单位；redo 在新编辑后清空；I/O 屏障 | `history-io.test.ts` |
| 约定 | `#` 注释、双引号、错误前缀、成功摘要 | ✅ | `parser.test.ts`、`cli-application.test.ts` |
| 阶段边界 | `create box […]` | ✅ 按规范返回 `unknown shape type: box (is the plugin loaded?)` | `editing.test.ts` |

### 4.2 自动化测试

测试分 7 个文件、**49 个用例**：

| 文件 | 用例数 | 覆盖重点 |
|---|---:|---|
| `tests/application/parser.test.ts` | 6 | 分词、引号、注释、Windows 路径、未闭合引号 |
| `tests/domain/model.test.ts` | 6 | 多态几何、Composite 递归、Memento 重复恢复、id 大小写/重复、全类型 clone |
| `tests/integration/display.test.ts` | 3 | tree/show/help 格式与错误 |
| `tests/integration/editing.test.ts` | 9 | 全命令、`in`、group/ungroup、addto、z-order、失败原子性 |
| `tests/integration/history-io.test.ts` | 12 | I/O 屏障、redo 清空、save/read 失败不改状态、默认路径 |
| `tests/io/svg-io.test.ts` | 11 | 缺 id 警告、顺序、round-trip、属性保留、XML 转义、坏输入 |
| `tests/cli/cli-application.test.ts` | 2 | banner、prompt、错误前缀、quit |

覆盖率（`npm run test:coverage`，v8）：

```text
Test Files  7 passed (7)
     Tests  49 passed (49)
All files   88.19% stmts | 69.44% branch | 91.44% funcs | 88.15% lines
```

其中 `application` 为 95.3%、`infrastructure` 为 92.1%、`domain/command` 为 87.9%，`domain/model` 为 81.8%；未覆盖的主要是防御性分支（例如“validated 后容器消失”的内部异常）和少数参数错误分支。

### 4.3 手工验收

除自动化测试外，按典型会话实录做了端到端验收：

1. `npm run cli` 启动，看到 `svg-editor 0.1 — type 'help' for commands` 与 `svg>`；
2. 输入规范的流程图会话（`examples/flowchart.session`），得到 8 个元素并 `save examples/flowchart.svg`；
3. 用 Edge 打开 SVG，渲染结果即文档顶部截图；
4. 用规范中的 `other.svg` 验证缺 id：
   ```text
   warning: assigned id rect1 to unnamed <rect>
   read other.svg (7 elements)
   ```
5. 验证失败原子性：保存到不存在目录、读取坏 XML、`set` 未知属性之后，原文档仍可 `undo` 上一条编辑；
6. `npm run build` 后执行 `node dist/cli/main.js`，确认编译产物同样可运行。

### 4.4 质量门禁与开发过程

最终交付前要求以下命令全绿：

```text
npm run typecheck      # tsc --noEmit
npm run check:arch     # 依赖方向 + 一类一文件
npm test               # 7 个测试文件、49 个用例
npm run test:coverage  # 88% 左右语句/行覆盖
npm run build          # 生成可执行的 dist/
```

Git 历史按“脚手架 → 领域模型与命令 → 应用层 → IO → CLI → 测试 → 文档/截图 → 修复”分步提交，没有一次性大提交；最终版本打 `final` tag。提交信息使用 `feat/test/fix/docs/chore` 前缀，便于追踪每一步。

### 4.5 已知边界（如实说明）

1. **`box` 插件未实现**：这是规范明确的 Phase 2 内容；本阶段 `create box` 按约定报错。
2. **SVG transform 只保留、不解释**：导入的 `transform` 等未知属性会保存在 `extraAttributeEntries` 并在保存时写回，但编辑器不会把矩阵分解进子节点坐标。对无 transform 的文档语义完整；对带 transform 的外部文档，几何命令作用于局部坐标。
3. **未知可见元素拒绝导入**：`path`、`polygon` 等不在六种内置类型内的元素报 `unsupported SVG element`；`title/desc/metadata/defs/style/script` 作为非渲染元数据忽略。
4. **undo 使用整树快照**：实现简单、恢复精确，但历史深度大且文档大时内存会增长；变化点 3 已说明替换路径。
5. **导入文本会 trim 首尾空白**：终端树形显示更稳定；如果需要保留 SVG 文本的首尾空白，可在 reader 中改为原样保留。
6. **没有 Web GUI/插件加载器**：不属于 Phase 1 要求；CLI 之外的通道在变化点 5 中预留。

这些边界不影响本阶段命令表的完整性与规范要求的错误行为；它们是下一阶段（插件化、Web、transform 映射）的明确输入，而不是未记录的缺陷。

---

## 5. 附：常用验证命令

```bash
# 安装与交互
npm install
npm run cli

# 完整门禁
npm run check
npm run test:coverage
npm run build

# 编译产物
npm start

# 重放示例
Get-Content examples/flowchart.session -Encoding UTF8 | npm run cli
```

更精简的上手说明见仓库根目录 [`README.md`](../README.md)。
