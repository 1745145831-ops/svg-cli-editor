import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommandDispatcher } from "../../src/application/CommandDispatcher.js";
import { CommandParser } from "../../src/application/CommandParser.js";
import { EditorSession } from "../../src/application/EditorSession.js";
import type { CommandContext } from "../../src/application/handlers/CommandContext.js";
import { ShapeFactory } from "../../src/domain/factory/ShapeFactory.js";
import { FileSvgGateway } from "../../src/infrastructure/svg/FileSvgGateway.js";
import { SvgDocumentReader } from "../../src/infrastructure/svg/SvgDocumentReader.js";
import { SvgDocumentWriter } from "../../src/infrastructure/svg/SvgDocumentWriter.js";
import { UserError } from "../../src/shared/UserError.js";

export interface CommandOutcome {
  readonly message: string;
  readonly warnings: readonly string[];
  readonly error?: string;
  readonly exit: boolean;
}

/** In-process CLI harness: parser -> dispatcher -> real filesystem gateway. */
export class CommandHarness {
  public readonly session = new EditorSession();
  public readonly factory = new ShapeFactory();
  public readonly gateway: FileSvgGateway;
  public readonly dispatcher = new CommandDispatcher();
  public readonly parser = new CommandParser();
  public readonly context: CommandContext;
  public readonly directory: string;

  public constructor() {
    this.directory = mkdtempSync(join(tmpdir(), "svg-editor-test-"));
    this.gateway = new FileSvgGateway(
      new SvgDocumentReader(this.factory),
      new SvgDocumentWriter()
    );
    this.context = {
      session: this.session,
      gateway: this.gateway,
      shapeFactory: this.factory
    };
  }

  public run(line: string): CommandOutcome {
    try {
      const command = this.parser.parse(line);
      if (command === null) {
        return { message: "", warnings: [], exit: false };
      }
      const result = this.dispatcher.dispatch(command, this.context);
      return {
        message: result.message,
        warnings: result.warnings ?? [],
        exit: result.exit === true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        message: "",
        warnings: [],
        error: error instanceof UserError ? message : `internal: ${message}`,
        exit: false
      };
    }
  }

  public success(line: string): CommandOutcome {
    const outcome = this.run(line);
    if (outcome.error !== undefined) {
      throw new Error(`command failed: ${line}\n${outcome.error}`);
    }
    return outcome;
  }

  public path(name: string): string {
    return join(this.directory, name);
  }

  public writeFile(name: string, content: string): string {
    const filePath = this.path(name);
    writeFileSync(filePath, content, "utf8");
    return filePath;
  }

  public readFile(name: string): string {
    return readFileSync(this.path(name), "utf8");
  }

  public dispose(): void {
    rmSync(this.directory, { recursive: true, force: true });
  }
}
