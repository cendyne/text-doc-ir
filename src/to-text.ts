import { readFileSync } from "fs";
import { FixedWidthTextVisitor } from "./main.ts";

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: bun run to-text -- <file.json> [width]");
  process.exit(1);
}

const filePath = args[0]!;
const width = args[1] ? parseInt(args[1], 10) : 80;

if (isNaN(width) || width < 1) {
  console.error(`Invalid width: ${args[1]}`);
  process.exit(1);
}

const json = JSON.parse(readFileSync(filePath, "utf-8"));
const visitor = new FixedWidthTextVisitor(width);
visitor.visit(json);

for (const line of visitor.getLines()) {
  console.log(line);
}
