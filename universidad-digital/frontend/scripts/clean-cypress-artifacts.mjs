import { rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const targets = [
  join(root, "cypress", "screenshots"),
  join(root, "cypress", "videos"),
  join(root, "cypress", "downloads"),
];

await Promise.all(
  targets.map((path) => rm(path, { recursive: true, force: true })),
);

console.log("Cypress artifacts cleaned.");
