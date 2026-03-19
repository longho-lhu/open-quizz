import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import { execSync } from "child_process";

const dbFile = "sqlite.db";
const needsInit = !fs.existsSync(dbFile) || fs.statSync(dbFile).size === 0;

const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });

if (needsInit) {
  console.log("Database is empty or missing. Initializing schema...");
  try {
    execSync("npx drizzle-kit push", { stdio: "inherit" });
    console.log("Database schema created successfully.");
  } catch (err) {
    console.error("Failed to push schema to database:", err);
  }
}
