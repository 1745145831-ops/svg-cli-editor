import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PluginConfigLoader } from "../../src/host/loader/PluginConfigLoader.js";
import { PluginRuntime } from "../../src/kernel/plugin/PluginRuntime.js";

const SIMPLE_PLUGIN = `
export default {
  manifest: { name: "@test/simple", contributes: { commands: ["alpha"] } },
  activate(context) {
    context.registerCommand({
      name: "alpha", usage: "alpha", summary: "test",
      execute() { return { message: "ok" }; }
    });
  }
};
`;

describe("PluginConfigLoader", () => {
  let directory: string;
  let runtime: PluginRuntime;
  let loader: PluginConfigLoader;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "plugin-loader-test-"));
    runtime = new PluginRuntime();
    loader = new PluginConfigLoader(runtime);
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const write = (relative: string, content: string): string => {
    const path = join(directory, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
    return path;
  };

  const config = (entries: unknown): string =>
    write("plugins.config.json", JSON.stringify({ plugins: entries }));

  it("loads modules by config-relative path and registers through the runtime", async () => {
    write("mods/alpha.mjs", SIMPLE_PLUGIN);
    const errors = await loader.load(config([{ module: "./mods/alpha.mjs" }]));
    expect(errors).toEqual([]);
    expect(runtime.commands.find("alpha")?.name).toBe("alpha");
  });

  it("reports a missing module and continues with later entries", async () => {
    write("mods/alpha.mjs", SIMPLE_PLUGIN);
    const errors = await loader.load(
      config([
        { module: "./mods/missing.mjs" },
        { module: "./mods/alpha.mjs" }
      ])
    );
    expect(errors).toEqual(["plugin not found: ./mods/missing.mjs"]);
    expect(runtime.commands.find("alpha")).toBeDefined();
  });

  it("rejects a module without a default export", async () => {
    write("mods/no-default.mjs", "export const value = 1;\n");
    const errors = await loader.load(config([{ module: "./mods/no-default.mjs" }]));
    expect(errors).toEqual([
      "plugin has no default export: ./mods/no-default.mjs"
    ]);
  });

  it("reports manifest mismatch using package.json contributes", async () => {
    write(
      "mods/mismatch/package.json",
      JSON.stringify({
        name: "@test/mismatch",
        type: "module",
        main: "index.mjs",
        contributes: { commands: ["gamma"] }
      })
    );
    write(
      "mods/mismatch/index.mjs",
      `export default {
        manifest: { name: "@test/mismatch", contributes: { commands: ["gamma"] } },
        activate(context) {
          context.registerCommand({ name: "delta", usage: "delta", summary: "", execute() { return { message: "" }; } });
        }
      };`
    );
    const errors = await loader.load(config([{ module: "./mods/mismatch" }]));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("plugin manifest mismatch: @test/mismatch");
    expect(errors[0]).toContain("declared: attributes=[], commands=[gamma]");
    expect(errors[0]).toContain("registered: attributes=[], commands=[delta]");
    expect(runtime.commands.find("delta")).toBeUndefined();
  });

  it("reports activation errors with the plugin name", async () => {
    write(
      "mods/boom.mjs",
      `export default {
        manifest: { name: "@test/boom", contributes: {} },
        activate() { throw new Error("boom"); }
      };`
    );
    const errors = await loader.load(config([{ module: "./mods/boom.mjs" }]));
    expect(errors).toEqual(["plugin failed to activate: @test/boom (boom)"]);
  });

  it("rejects duplicate registrations and rolls back the whole plugin", async () => {
    write(
      "mods/first.mjs",
      `export default {
        manifest: { name: "@test/first", contributes: { commands: ["dup"] } },
        activate(context) {
          context.registerCommand({ name: "dup", usage: "dup", summary: "", execute() { return { message: "" }; } });
        }
      };`
    );
    write(
      "mods/second.mjs",
      `export default {
        manifest: { name: "@test/second", contributes: { commands: ["dup", "solo"] } },
        activate(context) {
          context.registerCommand({ name: "dup", usage: "dup", summary: "", execute() { return { message: "" }; } });
          context.registerCommand({ name: "solo", usage: "solo", summary: "", execute() { return { message: "" }; } });
        }
      };`
    );
    const errors = await loader.load(
      config([{ module: "./mods/first.mjs" }, { module: "./mods/second.mjs" }])
    );
    expect(errors).toEqual(["duplicate registration: commands/dup"]);
    expect(runtime.commands.find("dup")).toBeDefined();
    expect(runtime.commands.find("solo")).toBeUndefined();
  });

  it("reports invalid config and skips disabled entries", async () => {
    write("bad.json", "{ not json");
    expect(await loader.load(join(directory, "bad.json"))).toEqual([
      "invalid plugin config"
    ]);
    const badShape = write(
      "bad-shape.json",
      JSON.stringify({ plugins: [{ module: 3 }] })
    );
    expect(await loader.load(badShape)).toEqual(["invalid plugin config"]);

    write("mods/alpha.mjs", SIMPLE_PLUGIN);
    const disabled = await loader.load(
      config([
        { module: "./mods/missing.mjs", enabled: false },
        { module: "./mods/alpha.mjs" }
      ])
    );
    expect(disabled).toEqual([]);
  });

  it("passes options through configure before activation", async () => {
    write(
      "mods/options.mjs",
      `export const state = { fill: "unset" };
      export default {
        manifest: { name: "@test/options", contributes: { commands: ["opt"] } },
        configure(options) { state.fill = options.fill; },
        activate(context) {
          context.registerCommand({ name: "opt", usage: "opt", summary: "", execute() { return { message: state.fill }; } });
        }
      };`
    );
    const errors = await loader.load(
      config([{ module: "./mods/options.mjs", options: { fill: "#abc" } }])
    );
    expect(errors).toEqual([]);
    const imported = (await import(pathToFileURL(join(directory, "mods/options.mjs")).href)) as {
      state: { fill: string };
    };
    expect(imported.state.fill).toBe("#abc");
  });

  it("distinguishes an evaluation failure from a missing module", async () => {
    write("mods/broken.mjs", 'import "./does-not-exist.mjs";\nexport default {};\n');
    const errors = await loader.load(config([{ module: "./mods/broken.mjs" }]));
    expect(errors[0]).toContain("plugin failed to activate: ./mods/broken.mjs");
    expect(errors[0]).not.toContain("plugin not found");
  });
});
