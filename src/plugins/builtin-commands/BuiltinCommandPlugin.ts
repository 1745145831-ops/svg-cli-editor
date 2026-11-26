import { AddToCommandHandler } from "../../application/handlers/AddToCommandHandler.js";
import { BackCommandHandler } from "../../application/handlers/BackCommandHandler.js";
import { CanvasCommandHandler } from "../../application/handlers/CanvasCommandHandler.js";
import { CreateCommandHandler } from "../../application/handlers/CreateCommandHandler.js";
import { DeleteCommandHandler } from "../../application/handlers/DeleteCommandHandler.js";
import { FrontCommandHandler } from "../../application/handlers/FrontCommandHandler.js";
import { GroupCommandHandler } from "../../application/handlers/GroupCommandHandler.js";
import { HelpCommandHandler } from "../../application/handlers/HelpCommandHandler.js";
import { InitCommandHandler } from "../../application/handlers/InitCommandHandler.js";
import { MoveCommandHandler } from "../../application/handlers/MoveCommandHandler.js";
import { QuitCommandHandler } from "../../application/handlers/QuitCommandHandler.js";
import { ReadCommandHandler } from "../../application/handlers/ReadCommandHandler.js";
import { RedoCommandHandler } from "../../application/handlers/RedoCommandHandler.js";
import { SaveCommandHandler } from "../../application/handlers/SaveCommandHandler.js";
import { ScaleCommandHandler } from "../../application/handlers/ScaleCommandHandler.js";
import { SetCommandHandler } from "../../application/handlers/SetCommandHandler.js";
import { ShowCommandHandler } from "../../application/handlers/ShowCommandHandler.js";
import { TreeCommandHandler } from "../../application/handlers/TreeCommandHandler.js";
import { UndoCommandHandler } from "../../application/handlers/UndoCommandHandler.js";
import { UngroupCommandHandler } from "../../application/handlers/UngroupCommandHandler.js";
import { ShapeDetailsFormatter } from "../../application/display/ShapeDetailsFormatter.js";
import type { Plugin } from "../../kernel/plugin/Plugin.js";
import type { PluginManifest } from "../../kernel/plugin/PluginManifest.js";
import type { PluginContext } from "../../kernel/plugin/PluginContext.js";
import { RegisteredCommand } from "./RegisteredCommand.js";

/** Registers every Phase 1 REPL command through the Command extension point. */
export class BuiltinCommandPlugin implements Plugin {
  public readonly manifest: PluginManifest = {
    name: "@svgframe/plugin-builtin-commands",
    contributes: {
      commands: [
        "init",
        "read",
        "save",
        "canvas",
        "create",
        "delete",
        "move",
        "scale",
        "set",
        "group",
        "ungroup",
        "addto",
        "front",
        "back",
        "tree",
        "show",
        "help",
        "undo",
        "redo",
        "quit"
      ]
    }
  };

  public activate(context: PluginContext): void {
    const formatter = new ShapeDetailsFormatter();
    const commands: RegisteredCommand[] = [
      new RegisteredCommand("init", new InitCommandHandler(), "init [width] [height]", ""),
      new RegisteredCommand("read", new ReadCommandHandler(), "read <file.svg>", ""),
      new RegisteredCommand("save", new SaveCommandHandler(), "save [file.svg]", ""),
      new RegisteredCommand("canvas", new CanvasCommandHandler(), "canvas [width] [height]", ""),
      new RegisteredCommand("create", new CreateCommandHandler(), "create <type> <id> ...", ""),
      new RegisteredCommand("delete", new DeleteCommandHandler(), "delete <id>", ""),
      new RegisteredCommand("move", new MoveCommandHandler(), "move <id> <dx> <dy>", ""),
      new RegisteredCommand("scale", new ScaleCommandHandler(), "scale <id> <factor>", ""),
      new RegisteredCommand("set", new SetCommandHandler(), "set <id> <attr> <value>", ""),
      new RegisteredCommand("group", new GroupCommandHandler(), "group <newGid> <id...>", ""),
      new RegisteredCommand("ungroup", new UngroupCommandHandler(), "ungroup <gid>", ""),
      new RegisteredCommand("addto", new AddToCommandHandler(), "addto <gid> <id>", ""),
      new RegisteredCommand("front", new FrontCommandHandler(), "front <id>", ""),
      new RegisteredCommand("back", new BackCommandHandler(), "back <id>", ""),
      new RegisteredCommand("tree", new TreeCommandHandler(), "tree [id]", ""),
      new RegisteredCommand("show", new ShowCommandHandler(formatter), "show <id>", ""),
      new RegisteredCommand("help", new HelpCommandHandler(), "help", ""),
      new RegisteredCommand("undo", new UndoCommandHandler(), "undo", ""),
      new RegisteredCommand("redo", new RedoCommandHandler(), "redo", ""),
      new RegisteredCommand("quit", new QuitCommandHandler(), "quit / exit", "", ["exit"])
    ];
    for (const command of commands) {
      context.registerCommand(command);
    }
  }
}

export default new BuiltinCommandPlugin();
