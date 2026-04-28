import { execSync } from "child_process";
import { relative } from "path";

export function commitProjectMemoryFiles(
  projectRoot: string,
  filePaths: string[],
  message: string,
): boolean {
  const relativePaths = filePaths.map((filePath) => relative(projectRoot, filePath));

  try {
    execSync(
      `git -C "${projectRoot}" add -- ${relativePaths.map((filePath) => `"${filePath}"`).join(" ")}`,
      { encoding: "utf-8" },
    );
    execSync(`git -C "${projectRoot}" commit -m "${message.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
    });
    return true;
  } catch {
    return false;
  }
}
