import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import type { SvgReadResult } from "./SvgReadResult.js";

/**
 * Outbound port for SVG persistence. The infrastructure layer implements it;
 * handlers never import Node's filesystem APIs.
 */
export interface SvgDocumentGateway {
  read(filePath: string): SvgReadResult;
  write(document: SvgDocument, filePath: string): void;
}
