import { CommandDispatcher } from "../application/CommandDispatcher.js";
import { EditorSession } from "../application/EditorSession.js";
import { SvgDocumentReader } from "../infrastructure/svg/SvgDocumentReader.js";
import { SvgDocumentWriter } from "../infrastructure/svg/SvgDocumentWriter.js";
import { FileSvgGateway } from "../infrastructure/svg/FileSvgGateway.js";
import { NodeDirectoryAccess } from "../infrastructure/fs/NodeDirectoryAccess.js";
import type { CommandContext } from "../kernel/context/CommandContext.js";
import type { DirectoryAccess } from "../kernel/ports/DirectoryAccess.js";
import type { Plugin } from "../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../kernel/plugin/PluginManifest.js";
import { PluginRuntime } from "../kernel/plugin/PluginRuntime.js";
import { BuiltinCommandPlugin } from "../plugins/builtin-commands/BuiltinCommandPlugin.js";
import { BuiltinShapesPlugin } from "../plugins/builtin-shapes/BuiltinShapesPlugin.js";

/**
 * Composition root shared by the CLI and tests. Built-ins still enter through
 * PluginRuntime.activate; optional code/config plugins use the same method.
 */
export class PluginHost {
  public readonly runtime = new PluginRuntime();
  public readonly events = this.runtime.events;
  public readonly session: EditorSession;
  public readonly context: CommandContext;
  public readonly dispatcher: CommandDispatcher;

  public constructor(
    cwd = process.cwd(),
    directory: DirectoryAccess = new NodeDirectoryAccess()
  ) {
    this.runtime.activate(new BuiltinShapesPlugin());
    this.runtime.activate(new BuiltinCommandPlugin());

    this.session = new EditorSession(this.events);
    const gateway = new FileSvgGateway(
      new SvgDocumentReader(this.runtime.shapes),
      new SvgDocumentWriter()
    );
    this.dispatcher = new CommandDispatcher(this.runtime.commands);
    this.context = {
      session: this.session,
      gateway,
      shapes: this.runtime.shapes,
      commands: this.runtime.commands,
      decorators: this.runtime.decorators,
      attributes: this.runtime.attributes,
      directory,
      cwd,
      events: this.events
    };
  }

  public activate(
    plugin: Plugin,
    options?: Readonly<Record<string, unknown>>,
    manifest?: PluginManifest
  ): void {
    this.runtime.activate(plugin, options, manifest);
  }
}
