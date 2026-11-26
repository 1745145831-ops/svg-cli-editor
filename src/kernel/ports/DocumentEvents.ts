import type { SvgDocument } from "../../domain/model/SvgDocument.js";

export type DocumentEvent =
  | { readonly type: "loaded"; readonly document: SvgDocument }
  | { readonly type: "saved"; readonly document: SvgDocument };

export interface DocumentEventSubscriber {
  onDocumentEvent(event: DocumentEvent): void;
}
