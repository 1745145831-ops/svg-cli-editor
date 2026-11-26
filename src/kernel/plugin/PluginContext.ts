import type { DocumentEventSubscriber } from "../ports/DocumentEvents.js";
import type { AttributeHandler } from "./AttributeHandler.js";
import type { Command } from "./Command.js";
import type { ShapeProvider } from "./ShapeProvider.js";
import type { TreeDecorator } from "./TreeDecorator.js";

/**
 * The only API visible to a plugin during activation. Everything is staged in
 * a transaction and committed by PluginRuntime after manifest validation.
 */
export interface PluginContext {
  registerShape(provider: ShapeProvider): void;
  registerCommand(command: Command): void;
  registerDecorator(decorator: TreeDecorator): void;
  registerAttributeHandler(handler: AttributeHandler): void;
  subscribe(subscriber: DocumentEventSubscriber): void;
}

