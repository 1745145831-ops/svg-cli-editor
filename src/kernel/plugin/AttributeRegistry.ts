import type { Shape } from "../../domain/model/Shape.js";
import type { SvgDocument } from "../../domain/model/SvgDocument.js";
import { UserError } from "../../shared/UserError.js";
import type { AttributeHandler, AttributeRequest } from "./AttributeHandler.js";
import { PluginError } from "./PluginError.js";

interface Candidate {
  readonly handler: AttributeHandler;
  readonly index: number;
}

/**
 * Registry for the AttributeHandler extension point. Conflict rule: the
 * highest priority handler wins; if two matching handlers share that highest
 * priority the command is rejected before any mutation (no implicit order).
 */
export class AttributeRegistry {
  private readonly handlers: AttributeHandler[] = [];

  public register(handler: AttributeHandler): void {
    this.assertAvailable(handler.name);
    this.handlers.push(handler);
  }

  public assertAvailable(name: string): void {
    if (this.handlers.some((handler) => handler.name === name)) {
      throw new PluginError(
        "duplicate-registration",
        `duplicate registration: attributes/${name}`
      );
    }
  }

  /**
   * Returns false when no handler claims the request (caller uses the Phase 1
   * attribute rules); otherwise applies the winning handler and returns true.
   */
  public apply(
    document: SvgDocument,
    shape: Shape,
    attribute: string,
    value: string
  ): boolean {
    const request: AttributeRequest = { document, shape, attribute, value };
    const candidates: Candidate[] = [];
    this.handlers.forEach((handler, index) => {
      if (handler.handles(request)) {
        candidates.push({ handler, index });
      }
    });
    if (candidates.length === 0) {
      return false;
    }
    const sorted = candidates.sort((left, right) => {
      const priority = right.handler.priority - left.handler.priority;
      return priority === 0 ? left.index - right.index : priority;
    });
    const winner = sorted[0];
    const runnerUp = sorted[1];
    if (
      winner !== undefined &&
      runnerUp !== undefined &&
      winner.handler.priority === runnerUp.handler.priority
    ) {
      throw new UserError(
        `ambiguous attribute handlers for ${shape.id}/${attribute}: ` +
          `${winner.handler.name}, ${runnerUp.handler.name}`
      );
    }
    winner?.handler.apply(request);
    return true;
  }

  public all(): readonly AttributeHandler[] {
    return this.handlers;
  }
}
