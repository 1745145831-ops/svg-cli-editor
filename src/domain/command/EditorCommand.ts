import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";

/**
 * A single undoable editor operation (Command pattern). Concrete commands
 * use a DocumentMemento for exact undo/redo (Memento pattern).
 */
export interface EditorCommand {
  execute(document: SvgDocument): CommandResult;
  undo(document: SvgDocument): CommandResult;
  redo(document: SvgDocument): CommandResult;
}
