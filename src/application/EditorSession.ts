import type { CommandResult } from "../domain/command/CommandResult.js";
import type { EditorCommand } from "../domain/command/EditorCommand.js";
import { UndoManager } from "../domain/command/UndoManager.js";
import { SvgDocument } from "../domain/model/SvgDocument.js";
import { DocumentEventBus } from "../kernel/ports/DocumentEventBus.js";
import type { SessionPort } from "../kernel/ports/SessionPort.js";
import { UserError } from "../shared/UserError.js";

/**
 * Application-level editing session. It owns the current document, its path
 * and the undo history, and is the only place where document-level commands
 * can create the I/O undo barrier.
 */
export class EditorSession implements SessionPort {
  private currentDocument: SvgDocument | null = null;
  private filePath: string | null = null;
  private readonly undoManager = new UndoManager();

  public constructor(private readonly events = new DocumentEventBus()) {}

  public get document(): SvgDocument | null {
    return this.currentDocument;
  }

  public get currentFilePath(): string | null {
    return this.filePath;
  }

  public get history(): UndoManager {
    return this.undoManager;
  }

  public get hasDocument(): boolean {
    return this.currentDocument !== null;
  }

  public requireDocument(): SvgDocument {
    if (this.currentDocument === null) {
      throw new UserError("no document. use 'init' or 'read' first");
    }
    return this.currentDocument;
  }

  public initialize(width: number, height: number): void {
    this.currentDocument = new SvgDocument(width, height);
    this.filePath = null;
    this.undoManager.clearAndBlock();
    this.events.emit({ type: "loaded", document: this.currentDocument });
  }

  public load(document: SvgDocument, filePath: string): void {
    this.currentDocument = document;
    this.filePath = filePath;
    this.undoManager.clearAndBlock();
    this.events.emit({ type: "loaded", document });
  }

  public executeEdit(command: EditorCommand): CommandResult {
    const document = this.requireDocument();
    const result = command.execute(document);
    this.undoManager.record(command);
    return result;
  }

  public undo(): CommandResult {
    const document = this.requireDocument();
    return this.undoManager.undo(document);
  }

  public redo(): CommandResult {
    const document = this.requireDocument();
    return this.undoManager.redo(document);
  }

  public resizeDocument(width: number, height: number): void {
    const document = this.requireDocument();
    document.resize(width, height);
    this.undoManager.clearAndBlock();
  }

  /** Called only after a successful write. */
  public markSaved(filePath: string): void {
    this.filePath = filePath;
    this.undoManager.clearAndBlock();
    if (this.currentDocument !== null) {
      this.events.emit({ type: "saved", document: this.currentDocument });
    }
  }
}

