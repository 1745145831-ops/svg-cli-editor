# p2 文件清单与职责（自动生成）

> 由 `scripts/metrics.mjs` 生成；基线 `final` (609334c)，目标 `HEAD` (af8016d)。
> 行数为非空非注释行；CC 为文件级决策点近似值（1 + 决策点）。

| 文件 | 类别 | LOC | CC | 导出的类 | 职责 |
|---|---|---:|---:|---|---|
| `src/application/CommandDispatcher.ts` | kernel | 10 | 1 | CommandDispatcher | 解析、分发与会话 |
| `src/application/CommandParser.ts` | kernel | 17 | 4 | CommandParser | 解析、分发与会话 |
| `src/application/EditorSession.ts` | kernel | 69 | 3 | EditorSession | 解析、分发与会话 |
| `src/application/LineTokenizer.ts` | kernel | 58 | 17 | LineTokenizer | 解析、分发与会话 |
| `src/application/ParsedCommand.ts` | kernel | 4 | 1 | — | 解析、分发与会话 |
| `src/application/display/HelpText.ts` | kernel | 64 | 10 | HelpText | 帮助、结构树与详情渲染 |
| `src/application/display/ShapeDetailsFormatter.ts` | kernel | 34 | 8 | ShapeDetailsFormatter | 帮助、结构树与详情渲染 |
| `src/application/display/TreeRenderer.ts` | kernel | 68 | 13 | TreeRenderer | 帮助、结构树与详情渲染 |
| `src/application/handlers/AddToCommandHandler.ts` | kernel | 13 | 3 | AddToCommandHandler | 内置命令处理器 |
| `src/application/handlers/ArgumentCheck.ts` | kernel | 23 | 5 | ArgumentCheck | 内置命令处理器 |
| `src/application/handlers/BackCommandHandler.ts` | kernel | 13 | 2 | BackCommandHandler | 内置命令处理器 |
| `src/application/handlers/CanvasCommandHandler.ts` | kernel | 24 | 5 | CanvasCommandHandler | 内置命令处理器 |
| `src/application/handlers/CommandContext.ts` | kernel | 6 | 1 | — | 内置命令处理器 |
| `src/application/handlers/CreateCommandHandler.ts` | kernel | 49 | 10 | CreateCommandHandler | 内置命令处理器 |
| `src/application/handlers/DeleteCommandHandler.ts` | kernel | 11 | 2 | DeleteCommandHandler | 内置命令处理器 |
| `src/application/handlers/FrontCommandHandler.ts` | kernel | 13 | 2 | FrontCommandHandler | 内置命令处理器 |
| `src/application/handlers/GroupCommandHandler.ts` | kernel | 14 | 2 | GroupCommandHandler | 内置命令处理器 |
| `src/application/handlers/HelpCommandHandler.ts` | kernel | 14 | 2 | HelpCommandHandler | 内置命令处理器 |
| `src/application/handlers/InitCommandHandler.ts` | kernel | 21 | 5 | InitCommandHandler | 内置命令处理器 |
| `src/application/handlers/MoveCommandHandler.ts` | kernel | 16 | 4 | MoveCommandHandler | 内置命令处理器 |
| `src/application/handlers/QuitCommandHandler.ts` | kernel | 9 | 1 | QuitCommandHandler | 内置命令处理器 |
| `src/application/handlers/ReadCommandHandler.ts` | kernel | 15 | 2 | ReadCommandHandler | 内置命令处理器 |
| `src/application/handlers/RedoCommandHandler.ts` | kernel | 9 | 1 | RedoCommandHandler | 内置命令处理器 |
| `src/application/handlers/SaveCommandHandler.ts` | kernel | 18 | 4 | SaveCommandHandler | 内置命令处理器 |
| `src/application/handlers/ScaleCommandHandler.ts` | kernel | 15 | 3 | ScaleCommandHandler | 内置命令处理器 |
| `src/application/handlers/SetCommandHandler.ts` | kernel | 23 | 5 | SetCommandHandler | 内置命令处理器 |
| `src/application/handlers/ShowCommandHandler.ts` | kernel | 12 | 2 | ShowCommandHandler | 内置命令处理器 |
| `src/application/handlers/TreeCommandHandler.ts` | kernel | 12 | 1 | TreeCommandHandler | 内置命令处理器 |
| `src/application/handlers/UndoCommandHandler.ts` | kernel | 9 | 1 | UndoCommandHandler | 内置命令处理器 |
| `src/application/handlers/UngroupCommandHandler.ts` | kernel | 11 | 2 | UngroupCommandHandler | 内置命令处理器 |
| `src/cli/CliApplication.ts` | assembly | 65 | 12 | CliApplication | CLI 终端适配器与入口 |
| `src/cli/main.ts` | assembly | 59 | 15 | — | CLI 终端适配器与入口 |
| `src/domain/command/AddToContainerCommand.ts` | kernel | 50 | 9 | AddToContainerCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/CommandResult.ts` | kernel | 5 | 3 | — | 命令模式、Memento 与撤销 |
| `src/domain/command/CreateShapeCommand.ts` | kernel | 45 | 8 | CreateShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/DeleteShapeCommand.ts` | kernel | 28 | 3 | DeleteShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/EditCommand.ts` | kernel | 49 | 5 | EditCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/EditorCommand.ts` | kernel | 7 | 1 | — | 命令模式、Memento 与撤销 |
| `src/domain/command/GroupShapesCommand.ts` | kernel | 73 | 14 | GroupShapesCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/MoveShapeCommand.ts` | kernel | 44 | 5 | MoveShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/ReorderShapeCommand.ts` | kernel | 33 | 2 | ReorderShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/ScaleShapeCommand.ts` | kernel | 32 | 3 | ScaleShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/SetAttributeCommand.ts` | kernel | 44 | 3 | SetAttributeCommand | 命令模式、Memento 与撤销 |
| `src/domain/command/UndoManager.ts` | kernel | 66 | 8 | UndoManager | 命令模式、Memento 与撤销 |
| `src/domain/command/UngroupShapeCommand.ts` | kernel | 87 | 15 | UngroupShapeCommand | 命令模式、Memento 与撤销 |
| `src/domain/factory/SvgLength.ts` | kernel | 29 | 13 | SvgLength | SVG 长度归一化 |
| `src/domain/model/CircleShape.ts` | kernel | 63 | 4 | CircleShape | 领域模型与组合树 |
| `src/domain/model/DocumentMemento.ts` | kernel | 26 | 1 | DocumentMemento | 领域模型与组合树 |
| `src/domain/model/EllipseShape.ts` | kernel | 78 | 5 | EllipseShape | 领域模型与组合树 |
| `src/domain/model/GroupShape.ts` | kernel | 101 | 14 | GroupShape | 领域模型与组合树 |
| `src/domain/model/LineShape.ts` | kernel | 77 | 5 | LineShape | 领域模型与组合树 |
| `src/domain/model/RectShape.ts` | kernel | 78 | 5 | RectShape | 领域模型与组合树 |
| `src/domain/model/Shape.ts` | kernel | 150 | 19 | Shape | 领域模型与组合树 |
| `src/domain/model/SvgDocument.ts` | kernel | 176 | 31 | SvgDocument | 领域模型与组合树 |
| `src/domain/model/TextShape.ts` | kernel | 76 | 5 | TextShape | 领域模型与组合树 |
| `src/host/CodeAssembly.ts` | assembly | 11 | 1 | — | 组合根与代码装配 |
| `src/host/PluginHost.ts` | assembly | 51 | 3 | PluginHost | 组合根与代码装配 |
| `src/host/loader/PluginConfig.ts` | assembly | 8 | 3 | — | 配置装配加载器 |
| `src/host/loader/PluginConfigLoader.ts` | assembly | 152 | 47 | PluginConfigLoader | 配置装配加载器 |
| `src/infrastructure/fs/NodeDirectoryAccess.ts` | kernel | 21 | 4 | NodeDirectoryAccess | 目录访问基础设施适配器 |
| `src/infrastructure/svg/FileSvgGateway.ts` | kernel | 17 | 1 | FileSvgGateway | SVG 读写基础设施适配器 |
| `src/infrastructure/svg/SvgDocumentReader.ts` | kernel | 237 | 60 | SvgDocumentReader | SVG 读写基础设施适配器 |
| `src/infrastructure/svg/SvgDocumentWriter.ts` | kernel | 69 | 8 | SvgDocumentWriter | SVG 读写基础设施适配器 |
| `src/kernel/context/CommandContext.ts` | kernel | 19 | 1 | — | 命令上下文 |
| `src/kernel/plugin/AttributeHandler.ts` | kernel | 14 | 1 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/AttributeRegistry.ts` | kernel | 62 | 8 | AttributeRegistry | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/Command.ts` | kernel | 10 | 3 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/CommandRegistry.ts` | kernel | 53 | 12 | CommandRegistry | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/Plugin.ts` | kernel | 7 | 2 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/PluginActivationContext.ts` | kernel | 37 | 1 | PluginActivationContext | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/PluginContext.ts` | kernel | 12 | 1 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/PluginError.ts` | kernel | 13 | 1 | PluginError | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/PluginManifest.ts` | kernel | 51 | 12 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/PluginRuntime.ts` | kernel | 82 | 18 | PluginRuntime | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/ShapeProvider.ts` | kernel | 24 | 5 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/ShapeRegistry.ts` | kernel | 70 | 10 | ShapeRegistry | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/SvgProviderSupport.ts` | kernel | 64 | 11 | SvgProviderSupport | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/TreeDecorator.ts` | kernel | 10 | 1 | — | 扩展点接口、注册表与插件运行时 |
| `src/kernel/plugin/TreeDecoratorRegistry.ts` | kernel | 30 | 5 | TreeDecoratorRegistry | 扩展点接口、注册表与插件运行时 |
| `src/kernel/ports/DirectoryAccess.ts` | kernel | 8 | 1 | — | 内核出站端口与文档事件 |
| `src/kernel/ports/DocumentEventBus.ts` | kernel | 18 | 3 | DocumentEventBus | 内核出站端口与文档事件 |
| `src/kernel/ports/DocumentEvents.ts` | kernel | 7 | 1 | — | 内核出站端口与文档事件 |
| `src/kernel/ports/SessionPort.ts` | kernel | 16 | 1 | — | 内核出站端口与文档事件 |
| `src/kernel/ports/SvgDocumentGateway.ts` | kernel | 6 | 1 | — | 内核出站端口与文档事件 |
| `src/kernel/ports/SvgReadResult.ts` | kernel | 5 | 1 | — | 内核出站端口与文档事件 |
| `src/plugins/builtin-commands/BuiltinCommandPlugin.ts` | plugin | 83 | 2 | BuiltinCommandPlugin | 内置命令 Command 插件 |
| `src/plugins/builtin-commands/RegisteredCommand.ts` | plugin | 16 | 1 | RegisteredCommand | 内置命令 Command 插件 |
| `src/plugins/builtin-shapes/BuiltinShapesPlugin.ts` | plugin | 26 | 1 | BuiltinShapesPlugin | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/CircleShapeProvider.ts` | plugin | 38 | 4 | CircleShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/EllipseShapeProvider.ts` | plugin | 45 | 5 | EllipseShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/GroupShapeProvider.ts` | plugin | 22 | 2 | GroupShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/LineShapeProvider.ts` | plugin | 45 | 5 | LineShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/RectShapeProvider.ts` | plugin | 45 | 5 | RectShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/builtin-shapes/TextShapeProvider.ts` | plugin | 37 | 4 | TextShapeProvider | 内置图形 ShapeProvider 插件 |
| `src/plugins/dir/DirCommand.ts` | plugin | 41 | 7 | DirCommand | dir 命令插件 |
| `src/plugins/dir/DirPlugin.ts` | plugin | 14 | 1 | DirPlugin | dir 命令插件 |
| `src/plugins/dir/index.ts` | plugin | 3 | 1 | — | dir 命令插件 |
| `src/plugins/shape-box/BoxAttributeHandler.ts` | plugin | 30 | 6 | BoxAttributeHandler | box 图形、属性与树标签插件 |
| `src/plugins/shape-box/BoxPlugin.ts` | plugin | 22 | 1 | BoxPlugin | box 图形、属性与树标签插件 |
| `src/plugins/shape-box/BoxShape.ts` | plugin | 72 | 3 | BoxShape | box 图形、属性与树标签插件 |
| `src/plugins/shape-box/BoxShapeProvider.ts` | plugin | 74 | 14 | BoxShapeProvider | box 图形、属性与树标签插件 |
| `src/plugins/shape-box/BoxTypeDecorator.ts` | plugin | 7 | 2 | BoxTypeDecorator | box 图形、属性与树标签插件 |
| `src/plugins/shape-box/index.ts` | plugin | 3 | 1 | — | box 图形、属性与树标签插件 |
| `src/plugins/stats/StatsCommand.ts` | plugin | 38 | 7 | StatsCommand | stats 命令插件 |
| `src/plugins/stats/StatsPlugin.ts` | plugin | 14 | 1 | StatsPlugin | stats 命令插件 |
| `src/plugins/stats/index.ts` | plugin | 3 | 1 | — | stats 命令插件 |
| `src/plugins/tree-star/ModifiedStarDecorator.ts` | plugin | 54 | 7 | ModifiedStarDecorator | modified-star 树标签插件 |
| `src/plugins/tree-star/TreeStarPlugin.ts` | plugin | 16 | 1 | TreeStarPlugin | modified-star 树标签插件 |
| `src/plugins/tree-star/index.ts` | plugin | 3 | 1 | — | modified-star 树标签插件 |
| `src/shared/AttributeDisplay.ts` | kernel | 11 | 3 | AttributeDisplay | 共享格式化与错误 |
| `src/shared/NumberFormat.ts` | kernel | 52 | 12 | NumberFormat | 共享格式化与错误 |
| `src/shared/UserError.ts` | kernel | 6 | 1 | UserError | 共享格式化与错误 |

## VS Code 扩展（独立）

| 文件 | LOC | CC |
|---|---:|---:|
| `vscode-extension/src/extension.ts` | 14 | 1 |
| `vscode-extension/src/outlineParser.ts` | 224 | 58 |
| `vscode-extension/src/svgBadgeProvider.ts` | 25 | 4 |
| `vscode-extension/src/svgFile.ts` | 7 | 2 |
| `vscode-extension/src/svgOutlineProvider.ts` | 28 | 1 |
