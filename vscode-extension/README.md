# SVG Outline & Badge

A small VS Code extension for the PJ1 SVG editor.

- Explorer shows a non-intrusive `[]` badge next to regular `.svg` files. The
  file name and contents are never modified.
- Opening an SVG text file shows its XML element hierarchy in VS Code's native
  Outline view. A node is labelled `tag` or `tag#id`; selecting it jumps to the
  opening tag in the source. The provider is refreshed automatically by VS Code
  after every text edit.
- Incomplete XML during editing is parsed best-effort. The outline may be
  partial for that moment, but the extension does not throw or crash.

## Run locally

```bash
npm install
npm run build:vscode
code --extensionDevelopmentPath=<repo>/vscode-extension <repo>/vscode-extension/sample-workspace
```

Open `sample-workspace/example.svg` and open the Explorer and Outline views.
The extension is also packaged with `npm run package:vscode` (VSIX).

The parser and symbol construction are covered by the repository's unit tests:

```bash
npx vitest run tests/vscode
```
