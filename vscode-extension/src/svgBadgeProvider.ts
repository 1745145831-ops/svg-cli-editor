import * as vscode from "vscode";
import { isSvgFileUri } from "./svgFile.js";

/**
 * Registers an interface-only decoration for regular `.svg` files. VS Code
 * renders the badge; this provider never writes to the file or URI.
 *
 * `workspace.fs.stat` is used so that a directory whose name happens to end in
 * `.svg` is not decorated.
 */
export class SvgBadgeProvider implements vscode.FileDecorationProvider {
  public async provideFileDecoration(
    uri: vscode.Uri
  ): Promise<vscode.FileDecoration | undefined> {
    if (!isSvgFileUri(uri)) {
      return undefined;
    }
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if ((stat.type & vscode.FileType.File) === 0) {
        return undefined;
      }
    } catch {
      return undefined;
    }
    return {
      badge: "[]",
      tooltip: "SVG file",
      color: new vscode.ThemeColor("charts.blue"),
      propagate: false
    };
  }
}
