import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { DB_PATH, ensureConfigDir } from "../config/loader.js";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  ensureConfigDir();

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");

  runMigrations(dbInstance);

  return dbInstance;
}

function runMigrations(db: Database.Database): void {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const migrationPath = join(currentDir, "migrations", "001_init.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");

  db.exec(migrationSql);
}
