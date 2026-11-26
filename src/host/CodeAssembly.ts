import type { Plugin } from "../kernel/plugin/Plugin.js";

/**
 * Code assembly (方式 A). Adding a plugin means importing its class instance
 * and appending it here; this is the only runtime file that changes.
 */
export const codeAssembly: readonly Plugin[] = [];
