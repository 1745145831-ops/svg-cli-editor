#!/usr/bin/env node
import { CommandDispatcher } from "../application/CommandDispatcher.js";
import { CommandParser } from "../application/CommandParser.js";
import { EditorSession } from "../application/EditorSession.js";
import type { CommandContext } from "../application/handlers/CommandContext.js";
import { ShapeFactory } from "../domain/factory/ShapeFactory.js";
import { FileSvgGateway } from "../infrastructure/svg/FileSvgGateway.js";
import { SvgDocumentReader } from "../infrastructure/svg/SvgDocumentReader.js";
import { SvgDocumentWriter } from "../infrastructure/svg/SvgDocumentWriter.js";
import { CliApplication } from "./CliApplication.js";

async function main(): Promise<void> {
  const session = new EditorSession();
  const shapeFactory = new ShapeFactory();
  const gateway = new FileSvgGateway(
    new SvgDocumentReader(shapeFactory),
    new SvgDocumentWriter()
  );
  const context: CommandContext = { session, gateway, shapeFactory };
  const application = new CliApplication(
    process.stdin,
    process.stdout,
    new CommandDispatcher(),
    new CommandParser(),
    context
  );
  await application.run();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`error: ${message}\n`);
  process.exitCode = 1;
});
