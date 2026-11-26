import type { Plugin } from "../kernel/plugin/Plugin.js";
import dirPlugin from "../plugins/dir/index.js";
import boxPlugin from "../plugins/shape-box/index.js";
import statsPlugin from "../plugins/stats/index.js";
import treeStarPlugin from "../plugins/tree-star/index.js";

/**
 * Code assembly (鏂瑰紡 A). Adding a plugin means importing its class instance
 * and appending it here; this is the only runtime file that changes.
 */
export const codeAssembly: readonly Plugin[] = [
  statsPlugin,
  dirPlugin,
  boxPlugin,
  treeStarPlugin
];


