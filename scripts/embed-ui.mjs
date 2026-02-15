// scripts/embed-ui.mjs
// Post-build step: embeds the Vite-built HTML into a JS module
// so it can be imported without filesystem reads (works in serverless environments)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("generated", { recursive: true });
const html = readFileSync("dist/mcp-app.html", "utf-8");
writeFileSync(
  "generated/ui-html.js",
  `export const UI_HTML = ${JSON.stringify(html)};\n`,
);
console.log("Embedded UI HTML into generated/ui-html.js");
