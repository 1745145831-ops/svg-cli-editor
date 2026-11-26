import type { CommandResult } from "../../domain/command/CommandResult.js";
import type { EditorCommand } from "../../domain/command/EditorCommand.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";

/**
 * The editing-session surface visible to command plugins. Keeping this as a
 * kernel port prevents plugins from depending on the application implementation.
 */
export interface SessionPort {
  readonly document: SvgDocument | null;
  readonly currentFilePath: string | null;
  readonly hasDocument: boolean;
  requireDocument(): SvgDocument;
  initialize(width: number, height: number): void;
  load(document: SvgDocument, filePath: string): void;
  executeEdit(command: EditorCommand): CommandResult;
  undo(): CommandResult;
  redo(): CommandResult;
  resizeDocument(width: number, height: number): void;
  markSaved(filePath: string): void;
}
