import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

const poolConnection = globalForDb.conn ?? mysql.createPool(process.env.DATABASE_URL || "mysql://user:password@localhost:3306/open_quizz");

if (process.env.NODE_ENV !== "production") globalForDb.conn = poolConnection;

export const db = drizzle(poolConnection, { schema, mode: "planetscale" });
