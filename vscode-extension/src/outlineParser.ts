/**
 * A deliberately small, position-preserving XML outline parser.
 *
 * VS Code already owns XML parsing/validation; this parser only needs enough
 * structure to build a DocumentSymbol tree while the user types. It is
 * tolerant by design: an incomplete tag ends the scan, unclosed elements are
 * closed at end-of-document, and a malformed construct marks the result as
 * incomplete instead of throwing.
 */
export interface OutlineNode {
  readonly tagName: string;
  readonly id: string | null;
  readonly start: number;
  readonly nameStart: number;
  readonly nameEnd: number;
  end: number;
  readonly children: OutlineNode[];
}

export interface OutlineParseResult {
  readonly roots: readonly OutlineNode[];
  readonly malformed: boolean;
}

const TAG_NAME = /[A-Za-z_][\w.:-]*/uy;

/** Parses an SVG/XML document into a best-effort outline tree. */
export class SvgOutlineParser {
  public parse(text: string): OutlineParseResult {
    const roots: OutlineNode[] = [];
    const stack: OutlineNode[] = [];
    let malformed = false;
    let index = 0;

    const append = (node: OutlineNode): void => {
      const parent = stack[stack.length - 1];
      if (parent === undefined) {
        roots.push(node);
      } else {
        parent.children.push(node);
      }
    };

    while (index < text.length) {
      const open = text.indexOf("<", index);
      if (open < 0) {
        break;
      }

      if (text.startsWith("<!--", open)) {
        const finish = text.indexOf("-->", open + 4);
        if (finish < 0) {
          malformed = true;
          break;
        }
        index = finish + 3;
        continue;
      }
      if (text.startsWith("<![CDATA[", open)) {
        const finish = text.indexOf("]]>", open + 9);
        if (finish < 0) {
          malformed = true;
          break;
        }
        index = finish + 3;
        continue;
      }
      if (text.startsWith("<?", open)) {
        const finish = text.indexOf("?>", open + 2);
        if (finish < 0) {
          malformed = true;
          break;
        }
        index = finish + 2;
        continue;
      }
      if (text.startsWith("<!", open)) {
        const finish = text.indexOf(">", open + 2);
        if (finish < 0) {
          malformed = true;
          break;
        }
        index = finish + 1;
        continue;
      }

      if (text.startsWith("</", open)) {
        const match = this.matchTagName(text, open + 2);
        if (match === null) {
          malformed = true;
          index = open + 2;
          continue;
        }
        const finish = text.indexOf(">", match.end);
        if (finish < 0) {
          malformed = true;
          break;
        }
        const closingName = text.slice(match.start, match.end);
        let found = false;
        while (stack.length > 0) {
          const popped = stack.pop();
          if (popped === undefined) {
            break;
          }
          popped.end = finish + 1;
          if (popped.tagName === closingName) {
            found = true;
            break;
          }
          malformed = true;
        }
        if (!found) {
          malformed = true;
        }
        index = finish + 1;
        continue;
      }

      const match = this.matchTagName(text, open + 1);
      if (match === null) {
        // Not a tag (for example a literal `<` while the user is typing).
        malformed = true;
        index = open + 1;
        continue;
      }

      const tagEnd = this.findTagEnd(text, match.end);
      if (tagEnd < 0) {
        // The user is in the middle of typing the opening tag. Keep the
        // already-complete ancestors and leave the incomplete node out.
        malformed = true;
        index = text.length;
        break;
      }

      const inside = text.slice(match.end, tagEnd);
      const selfClosing = /\/\s*$/u.test(inside);
      const attributes = this.readAttributes(text.slice(match.end, tagEnd));
      const node: OutlineNode = {
        tagName: text.slice(match.start, match.end),
        id: attributes.get("id") ?? null,
        start: open,
        nameStart: match.start,
        nameEnd: match.end,
        end: tagEnd + 1,
        children: []
      };
      append(node);
      if (!selfClosing) {
        stack.push(node);
      }
      index = tagEnd + 1;
    }

    while (stack.length > 0) {
      const node = stack.pop();
      if (node !== undefined) {
        node.end = text.length;
      }
      malformed = true;
    }

    return { roots, malformed };
  }

  private matchTagName(text: string, start: number): { start: number; end: number } | null {
    TAG_NAME.lastIndex = start;
    const match = TAG_NAME.exec(text);
    if (match === null) {
      return null;
    }
    return { start, end: start + match[0].length };
  }

  /** Finds the closing `>` while ignoring `>` inside quoted attributes. */
  private findTagEnd(text: string, start: number): number {
    let quote: string | null = null;
    for (let index = start; index < text.length; index += 1) {
      const character = text[index] ?? "";
      if (quote !== null) {
        if (character === quote) {
          quote = null;
        }
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === ">") {
        return index;
      }
    }
    return -1;
  }

  private readAttributes(source: string): Map<string, string> {
    const attributes = new Map<string, string>();
    let index = 0;
    while (index < source.length) {
      while (index < source.length && /[\s/]/u.test(source[index] ?? "")) {
        index += 1;
      }
      if (index >= source.length) {
        break;
      }
      const nameStart = index;
      while (index < source.length && !/[\s=/>]/u.test(source[index] ?? "")) {
        index += 1;
      }
      const name = source.slice(nameStart, index);
      while (index < source.length && /\s/u.test(source[index] ?? "")) {
        index += 1;
      }
      if (name.length === 0 || source[index] !== "=") {
        continue;
      }
      index += 1;
      while (index < source.length && /\s/u.test(source[index] ?? "")) {
        index += 1;
      }
      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) {
          index += 1;
        }
        attributes.set(name, this.decodeEntities(source.slice(valueStart, index)));
        index += 1;
      } else {
        const valueStart = index;
        while (index < source.length && !/[\s>]/u.test(source[index] ?? "")) {
          index += 1;
        }
        attributes.set(name, this.decodeEntities(source.slice(valueStart, index)));
      }
    }
    return attributes;
  }

  private decodeEntities(value: string): string {
    return value
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&");
  }
}

/** Outline label contract: `tag#id`, or `tag` when no id is present. */
export function outlineLabel(node: OutlineNode): string {
  return node.id === null || node.id.length === 0 ? node.tagName : `${node.tagName}#${node.id}`;
}
