#!/usr/bin/env node
import { CommandParser } from "../application/CommandParser.js";
import { codeAssembly } from "../host/CodeAssembly.js";
import { PluginConfigLoader } from "../host/loader/PluginConfigLoader.js";
import { PluginHost } from "../host/PluginHost.js";
import { CliApplication } from "./CliApplication.js";

interface StartupOptions {
  readonly configPath?: string;
}

function parseArguments(argv: readonly string[]): StartupOptions {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? "";
    if (argument === "--config") {
      return { configPath: argv[index + 1] ?? "" };
    }
    if (argument.startsWith("--config=")) {
      return { configPath: argument.slice("--config=".length) };
    }
  }
  return {};
}

function report(message: string): void {
  process.stderr.write(`error: ${message}\n`);
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const host = new PluginHost();

  if (options.configPath !== undefined) {
    if (options.configPath.length === 0) {
      report("invalid plugin config");
    } else {
      const loader = new PluginConfigLoader(host.runtime);
      for (const message of await loader.load(options.configPath)) {
        report(message);
      }
    }
  } else {
    for (const plugin of codeAssembly) {
      try {
        host.activate(plugin);
      } catch (error) {
        report(error instanceof Error ? error.message : String(error));
      }
    }
  }

  const application = new CliApplication(
    process.stdin,
    process.stdout,
    host.dispatcher,
    new CommandParser(),
    host.context
  );
  await application.run();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`error: ${message}\n`);
  process.exitCode = 1;
});
