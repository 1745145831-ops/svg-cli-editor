import * as vscode from "vscode";
import { outlineLabel, SvgOutlineParser, type OutlineNode } from "./outlineParser.js";

/** Native Outline adapter: parser output -> DocumentSymbol tree. */
export class SvgOutlineProvider implements vscode.DocumentSymbolProvider {
  private readonly parser = new SvgOutlineParser();

  public provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const parsed = this.parser.parse(document.getText());
    return parsed.roots.map((root) => this.toSymbol(document, root));
  }

  private toSymbol(document: vscode.TextDocument, node: OutlineNode): vscode.DocumentSymbol {
    const range = new vscode.Range(
      document.positionAt(node.start),
      document.positionAt(Math.max(node.start, node.end))
    );
    const selectionRange = new vscode.Range(
      document.positionAt(node.nameStart),
      document.positionAt(node.nameEnd)
    );
    const symbol = new vscode.DocumentSymbol(
      outlineLabel(node),
      "",
      vscode.SymbolKind.Object,
      range,
      selectionRange
    );
    symbol.children = node.children.map((child) => this.toSymbol(document, child));
    return symbol;
  }
}
