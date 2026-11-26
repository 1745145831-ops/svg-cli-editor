import type { DocumentEventSubscriber } from "../ports/DocumentEvents.js";
import type { AttributeHandler } from "./AttributeHandler.js";
import type { Command } from "./Command.js";
import type { PluginContext } from "./PluginContext.js";
import type { ContributionNames } from "./PluginManifest.js";
import type { ShapeProvider } from "./ShapeProvider.js";
import type { TreeDecorator } from "./TreeDecorator.js";

/** Collects one plugin's registrations until the runtime validates and commits them. */
export class PluginActivationContext implements PluginContext {
  public readonly shapeProviders: ShapeProvider[] = [];
  public readonly commands: Command[] = [];
  public readonly treeDecorators: TreeDecorator[] = [];
  public readonly attributeHandlers: AttributeHandler[] = [];
  public readonly subscribers: DocumentEventSubscriber[] = [];

  public registerShape(provider: ShapeProvider): void {
    this.shapeProviders.push(provider);
  }

  public registerCommand(command: Command): void {
    this.commands.push(command);
  }

  public registerDecorator(decorator: TreeDecorator): void {
    this.treeDecorators.push(decorator);
  }

  public registerAttributeHandler(handler: AttributeHandler): void {
    this.attributeHandlers.push(handler);
  }

  public subscribe(subscriber: DocumentEventSubscriber): void {
    this.subscribers.push(subscriber);
  }

  public contributions(): ContributionNames {
    return {
      shapes: this.shapeProviders.map((provider) => provider.shapeType).sort(),
      commands: this.commands.map((command) => command.name).sort(),
      decorators: this.treeDecorators.map((decorator) => decorator.name).sort(),
      attributes: this.attributeHandlers.map((handler) => handler.name).sort()
    };
  }
}

