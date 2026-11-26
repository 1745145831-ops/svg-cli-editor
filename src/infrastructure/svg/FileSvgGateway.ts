import type { SvgDocumentGateway } from "../../kernel/ports/SvgDocumentGateway.js";
import type { SvgReadResult } from "../../kernel/ports/SvgReadResult.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import { SvgDocumentReader } from "./SvgDocumentReader.js";
import { SvgDocumentWriter } from "./SvgDocumentWriter.js";

/** Filesystem adapter for the application's SVG gateway port. */
export class FileSvgGateway implements SvgDocumentGateway {
  public constructor(
    private readonly reader: SvgDocumentReader,
    private readonly writer: SvgDocumentWriter
  ) {}

  public read(filePath: string): SvgReadResult {
    return this.reader.read(filePath);
  }

  public write(document: SvgDocument, filePath: string): void {
    this.writer.write(document, filePath);
  }
}
