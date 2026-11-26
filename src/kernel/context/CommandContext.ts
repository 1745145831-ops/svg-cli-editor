import type { DirectoryAccess } from "../ports/DirectoryAccess.js";
import type { DocumentEventBus } from "../ports/DocumentEventBus.js";
import type { SessionPort } from "../ports/SessionPort.js";
import type { SvgDocumentGateway } from "../ports/SvgDocumentGateway.js";
import type { AttributeRegistry } from "../plugin/AttributeRegistry.js";
import type { CommandRegistry } from "../plugin/CommandRegistry.js";
import type { ShapeRegistry } from "../plugin/ShapeRegistry.js";
import type { TreeDecoratorRegistry } from "../plugin/TreeDecoratorRegistry.js";

/** Host services available to every command invocation. */
export interface CommandContext {
  readonly session: SessionPort;
  readonly gateway: SvgDocumentGateway;
  readonly shapes: ShapeRegistry;
  readonly commands: CommandRegistry;
  readonly decorators: TreeDecoratorRegistry;
  readonly attributes: AttributeRegistry;
  readonly directory: DirectoryAccess;
  readonly cwd: string;
  readonly events: DocumentEventBus;
}

