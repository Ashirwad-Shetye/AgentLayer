import { mkdirSync } from "fs";
import { dirname } from "path";

export function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
