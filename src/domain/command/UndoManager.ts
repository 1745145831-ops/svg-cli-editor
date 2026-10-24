import { UserError } from "../../shared/UserError.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { CommandResult } from "./CommandResult.js";
import type { EditorCommand } from "./EditorCommand.js";

/**
 * Command history. I/O commands place a barrier: they clear both stacks and
 * reject undo/redo until the next successful edit unblocks the manager.
 */
export class UndoManager {
  private readonly undoStack: EditorCommand[] = [];
  private readonly redoStack: EditorCommand[] = [];
  private blocked = false;

  public get canUndo(): boolean {
    return !this.blocked && this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return !this.blocked && this.redoStack.length > 0;
  }

  public get undoDepth(): number {
    return this.undoStack.length;
  }

  public get redoDepth(): number {
    return this.redoStack.length;
  }

  public record(command: EditorCommand): void {
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.blocked = false;
  }

  /** Called after init/read/save/canvas-resize. */
  public clearAndBlock(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.blocked = true;
  }

  public undo(document: SvgDocument): CommandResult {
    this.assertAllowed();
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new UserError("nothing to undo");
    }
    try {
      const result = command.undo(document);
      this.redoStack.push(command);
      return result;
    } catch (error) {
      this.undoStack.push(command);
      throw error;
    }
  }

  public redo(document: SvgDocument): CommandResult {
    this.assertAllowed();
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new UserError("nothing to redo");
    }
    try {
      const result = command.redo(document);
      this.undoStack.push(command);
      return result;
    } catch (error) {
      this.redoStack.push(command);
      throw error;
    }
  }

  private assertAllowed(): void {
    if (this.blocked) {
      throw new UserError("undo not allowed after io command");
    }
  }
}
