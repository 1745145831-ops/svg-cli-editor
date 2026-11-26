import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import type { SvgReadResult } from "./SvgReadResult.js";

/** Outbound port for SVG persistence; implemented by infrastructure adapters. */
export interface SvgDocumentGateway {
  read(filePath: string): SvgReadResult;
  write(document: SvgDocument, filePath: string): void;
}
