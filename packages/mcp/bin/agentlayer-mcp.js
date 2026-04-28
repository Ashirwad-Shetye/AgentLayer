#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env["AGENTLAYER_DEV"] === "1";

if (isDev) {
  await import(join(__dirname, "../src/server.ts"));
} else {
  await import(join(__dirname, "../dist/server.js"));
}
