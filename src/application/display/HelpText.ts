import type { CommandRegistry } from "../../kernel/plugin/CommandRegistry.js";
import type { ShapeRegistry } from "../../kernel/plugin/ShapeRegistry.js";

const BUILTIN_SHAPES = new Set(["rect", "circle", "ellipse", "line", "text", "g"]);

/** Help text for the REPL. Plugin shapes/commands are appended without core edits. */
export class HelpText {
  public static render(
    commands?: CommandRegistry,
    shapes?: ShapeRegistry
  ): string {
    const shapeLines = [
      "    rect <id> <x> <y> <w> <h> [fill]",
      "    circle <id> <cx> <cy> <r> [fill]",
      "    ellipse <id> <cx> <cy> <rx> <ry> [fill]",
      "    line <id> <x1> <y1> <x2> <y2> [stroke]",
      '    text <id> <x> <y> "content"',
      "    g <id>"
    ];
    for (const provider of shapes?.all() ?? []) {
      if (!BUILTIN_SHAPES.has(provider.shapeType) && provider.helpUsage !== undefined) {
        shapeLines.push(`    ${provider.helpUsage}`);
      }
    }

    const lines = [
      "svg-editor commands",
      "",
      "Document:",
      "  init [width] [height]       create an empty canvas (default 800 600)",
      "  read <file.svg>             load an SVG file as the current document",
      "  save [file.svg]             save; without a path reuse the read path",
      "  canvas [width] [height]     show or resize the canvas",
      "",
      "Shapes:",
      "  create <type> <id> [params...] [in <containerId>]",
      ...shapeLines,
      "  delete <id>                 delete a shape and its descendants",
      "  move <id> <dx> <dy>         translate by an increment",
      "  scale <id> <factor>         scale geometry by a positive factor",
      "  set <id> <attr> <value>     set fill/stroke/stroke-width, geometry or text",
      "  group <newGid> <id...>      group existing shapes into a new container",
      "  ungroup <gid>               dissolve a non-top-level container",
      "  addto <gid> <id>            move an existing shape into a container",
      "  front <id> / back <id>      reorder among siblings",
      "",
      "View / history:",
      "  tree [id]                   show the document or a subtree",
      "  show <id>                   show one shape's attributes",
      "  undo / redo                 undo or redo one edit",
      "  help                        show this help",
      "  quit / exit                 leave the editor"
    ];

    const pluginCommands = commands?.pluginCommands() ?? [];
    if (pluginCommands.length > 0) {
      lines.push("", "Plugin commands:");
      for (const command of pluginCommands) {
        lines.push(`  ${command.usage.padEnd(28)}${command.summary}`);
      }
    }

    lines.push(
      "",
      "Use double quotes for arguments containing spaces. Lines starting with # are comments. " +
        "I/O commands (init/read/save/canvas resize) start a new undo epoch."
    );
    return lines.join("\n");
  }
}
