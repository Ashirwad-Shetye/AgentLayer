import type Database from "better-sqlite3";

export function setToggleState(
  db: Database.Database,
  scope: string,
  enabled: boolean,
): void {
  db.prepare(
    `
      INSERT INTO toggle_state (scope, enabled, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(scope) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = excluded.updated_at
    `,
  ).run(scope, enabled ? 1 : 0);
}

export function getToggleState(
  db: Database.Database,
  scope: string,
): boolean | null {
  const row = db
    .prepare("SELECT enabled FROM toggle_state WHERE scope = ?")
    .get(scope) as { enabled: number } | undefined;

  if (!row) {
    return null;
  }

  return row.enabled === 1;
}
