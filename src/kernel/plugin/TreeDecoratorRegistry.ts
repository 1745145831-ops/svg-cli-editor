import type { TreeDecorator, TreeRow } from "./TreeDecorator.js";
import { PluginError } from "./PluginError.js";

/** Registry for the TreeDecorator extension point; insertion order is display order. */
export class TreeDecoratorRegistry {
  private readonly decorators: TreeDecorator[] = [];

  public register(decorator: TreeDecorator): void {
    this.assertAvailable(decorator.name);
    this.decorators.push(decorator);
  }

  public assertAvailable(name: string): void {
    if (this.decorators.some((decorator) => decorator.name === name)) {
      throw new PluginError(
        "duplicate-registration",
        `duplicate registration: decorators/${name}`
      );
    }
  }

  public decorationsFor(row: TreeRow): readonly string[] {
    const labels: string[] = [];
    for (const decorator of this.decorators) {
      const label = decorator.decorate(row);
      if (label !== null && label.length > 0) {
        labels.push(label);
      }
    }
    return labels;
  }

  public all(): readonly TreeDecorator[] {
    return this.decorators;
  }
}
