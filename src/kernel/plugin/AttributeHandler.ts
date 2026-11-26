import type { Shape } from "../../domain/model/Shape.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";

export interface AttributeRequest {
  readonly document: SvgDocument;
  readonly shape: Shape;
  readonly attribute: string;
  readonly value: string;
}

/**
 * Extension point for domain-specific `set` semantics. Handlers are selected
 * before mutation and run inside the SetAttributeCommand's memento
 * transaction, so a handler failure rolls back through the command.
 */
export interface AttributeHandler {
  readonly name: string;
  /** Higher priority is selected first. Equal highest priorities are rejected. */
  readonly priority: number;
  /** Pure predicate: it must not mutate the document. */
  handles(request: AttributeRequest): boolean;
  apply(request: AttributeRequest): void;
}
