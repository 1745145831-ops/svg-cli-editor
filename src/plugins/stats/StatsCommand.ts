import type { CommandResult } from "../../domain/command/CommandResult.js";
import { GroupShape } from "../../domain/model/GroupShape.js";
import type { Shape } from "../../domain/model/Shape.js";
import type { Command } from "../../kernel/plugin/Command.js";
import type { CommandContext } from "../../kernel/context/CommandContext.js";
import { UserError } from "../../shared/UserError.js";

/** Read-only depth-first count of leaves and containers in the current canvas. */
export class StatsCommand implements Command {
  public readonly name = "stats";
  public readonly usage = "stats";
  public readonly summary = "show leaf counts by shape type";
  public readonly helpGroup = "plugin" as const;

  public execute(args: readonly string[], context: CommandContext): CommandResult {
    if (args.length !== 0) {
      throw new UserError("usage: stats");
    }
    const document = context.session.requireDocument();
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;

    const visit = (shape: Shape): void => {
      if (shape instanceof GroupShape) {
        containers += 1;
        for (const child of shape.children) {
          visit(child);
        }
        return;
      }
      counts.set(shape.typeName, (counts.get(shape.typeName) ?? 0) + 1);
      total += 1;
    };
    for (const child of document.rootChildren) {
      visit(child);
    }

    const parts = [...counts.entries()].map(([type, count]) => `${type}: ${count}`);
    const prefix = parts.length === 0 ? "" : `${parts.join("  ")}  `;
    return { message: `${prefix}(total ${total}, containers ${containers})` };
  }
}
