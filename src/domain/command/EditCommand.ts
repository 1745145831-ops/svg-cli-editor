import { UserError } from "../../shared/UserError.js";
import type { DocumentMemento } from "../model/DocumentMemento.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { Shape } from "../model/Shape.js";
import type { CommandResult } from "./CommandResult.js";
import type { EditorCommand } from "./EditorCommand.js";

/**
 * Template for undoable commands. A command validates first, snapshots the
 * document (Memento), applies its change, and snapshots again. The snapshots
 * make multi-parent operations such as group/delete exactly reversible and
 * guarantee atomic failure: an exception in apply restores the before state.
 */
export abstract class EditCommand implements EditorCommand {
  private beforeState: DocumentMemento | null = null;
  private afterState: DocumentMemento | null = null;
  private successMessage = "";

  public execute(document: SvgDocument): CommandResult {
    this.validate(document);
    const before = document.createMemento();
    try {
      const result = this.apply(document);
      this.beforeState = before;
      this.afterState = document.createMemento();
      this.successMessage = result.message;
      return result;
    } catch (error) {
      document.restore(before);
      throw error;
    }
  }

  public undo(document: SvgDocument): CommandResult {
    if (this.beforeState === null) {
      throw new Error("command has not been executed");
    }
    document.restore(this.beforeState);
    return { message: this.buildUndoMessage(document) };
  }

  public redo(document: SvgDocument): CommandResult {
    if (this.afterState === null) {
      throw new Error("command has not been executed");
    }
    document.restore(this.afterState);
    return { message: this.successMessage };
  }

  protected abstract validate(document: SvgDocument): void;

  protected abstract apply(document: SvgDocument): CommandResult;

  protected abstract buildUndoMessage(document: SvgDocument): string;

  protected requireShape(document: SvgDocument, id: string): Shape {
    const shape = document.find(id);
    if (shape === undefined) {
      throw new UserError(`no such shape: ${id}`);
    }
    return shape;
  }
}
