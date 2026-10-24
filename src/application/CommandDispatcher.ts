import type { CommandResult } from "../domain/command/CommandResult.js";
import { UserError } from "../shared/UserError.js";
import { ShapeDetailsFormatter } from "./display/ShapeDetailsFormatter.js";
import { TreeRenderer } from "./display/TreeRenderer.js";
import { AddToCommandHandler } from "./handlers/AddToCommandHandler.js";
import { BackCommandHandler } from "./handlers/BackCommandHandler.js";
import { CanvasCommandHandler } from "./handlers/CanvasCommandHandler.js";
import type { CommandContext, CommandHandler } from "./handlers/CommandContext.js";
import { CreateCommandHandler } from "./handlers/CreateCommandHandler.js";
import { DeleteCommandHandler } from "./handlers/DeleteCommandHandler.js";
import { FrontCommandHandler } from "./handlers/FrontCommandHandler.js";
import { GroupCommandHandler } from "./handlers/GroupCommandHandler.js";
import { HelpCommandHandler } from "./handlers/HelpCommandHandler.js";
import { InitCommandHandler } from "./handlers/InitCommandHandler.js";
import { MoveCommandHandler } from "./handlers/MoveCommandHandler.js";
import { QuitCommandHandler } from "./handlers/QuitCommandHandler.js";
import { ReadCommandHandler } from "./handlers/ReadCommandHandler.js";
import { RedoCommandHandler } from "./handlers/RedoCommandHandler.js";
import { SaveCommandHandler } from "./handlers/SaveCommandHandler.js";
import { ScaleCommandHandler } from "./handlers/ScaleCommandHandler.js";
import { SetCommandHandler } from "./handlers/SetCommandHandler.js";
import { ShowCommandHandler } from "./handlers/ShowCommandHandler.js";
import { TreeCommandHandler } from "./handlers/TreeCommandHandler.js";
import { UndoCommandHandler } from "./handlers/UndoCommandHandler.js";
import { UngroupCommandHandler } from "./handlers/UngroupCommandHandler.js";
import type { ParsedCommand } from "./ParsedCommand.js";

/**
 * The single command-name -> handler dispatch table. Lookup-based dispatch
 * keeps handler selection out of procedural if/switch chains.
 */
export class CommandDispatcher {
  private readonly handlers = new Map<string, CommandHandler>();

  public constructor() {
    this.handlers.set("init", new InitCommandHandler());
    this.handlers.set("read", new ReadCommandHandler());
    this.handlers.set("save", new SaveCommandHandler());
    this.handlers.set("canvas", new CanvasCommandHandler());
    this.handlers.set("create", new CreateCommandHandler());
    this.handlers.set("delete", new DeleteCommandHandler());
    this.handlers.set("move", new MoveCommandHandler());
    this.handlers.set("scale", new ScaleCommandHandler());
    this.handlers.set("set", new SetCommandHandler());
    this.handlers.set("group", new GroupCommandHandler());
    this.handlers.set("ungroup", new UngroupCommandHandler());
    this.handlers.set("addto", new AddToCommandHandler());
    this.handlers.set("front", new FrontCommandHandler());
    this.handlers.set("back", new BackCommandHandler());
    this.handlers.set("tree", new TreeCommandHandler(new TreeRenderer()));
    this.handlers.set("show", new ShowCommandHandler(new ShapeDetailsFormatter()));
    this.handlers.set("help", new HelpCommandHandler());
    this.handlers.set("undo", new UndoCommandHandler());
    this.handlers.set("redo", new RedoCommandHandler());

    const quit = new QuitCommandHandler();
    this.handlers.set("quit", quit);
    this.handlers.set("exit", quit);
  }

  public dispatch(command: ParsedCommand, context: CommandContext): CommandResult {
    const handler = this.handlers.get(command.name);
    if (handler === undefined) {
      throw new UserError(`unknown command: ${command.name} (type 'help')`);
    }
    return handler.execute(command.args, context);
  }
}
