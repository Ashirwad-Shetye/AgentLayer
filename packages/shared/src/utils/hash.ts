import { createHash } from "crypto";

export function sha256Short(input: string, length = 12): string {
  return createHash("sha256").update(input).digest("hex").slice(0, length);
}
