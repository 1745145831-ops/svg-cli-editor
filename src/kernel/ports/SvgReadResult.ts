import type { SvgDocument } from "../../domain/model/SvgDocument.js";

export interface SvgReadResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}
