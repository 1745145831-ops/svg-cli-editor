import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { EditorSession } from "../EditorSession.js";
import type { ShapeFactory } from "../../domain/factory/ShapeFactory.js";
import type { SvgDocumentGateway } from "../gateway/SvgDocumentGateway.js";

/** Dependencies available to every command handler. */
export interface CommandContext {
  readonly session: EditorSession;
  readonly gateway: SvgDocumentGateway;
  readonly shapeFactory: ShapeFactory;
}

export interface CommandHandler {
  execute(args: readonly string[], context: CommandContext): CommandResult;
}
