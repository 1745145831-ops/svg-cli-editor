import * as vscode from "vscode";
import { SvgBadgeProvider } from "./svgBadgeProvider.js";
import { SvgOutlineProvider } from "./svgOutlineProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(new SvgBadgeProvider()),
    vscode.languages.registerDocumentSymbolProvider(
      [{ language: "xml", pattern: "**/*.svg" }],
      new SvgOutlineProvider()
    )
  );
}

export function deactivate(): void {
  // Providers are disposed through context.subscriptions.
}
