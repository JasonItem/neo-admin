import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

function createPool() {
  // 连接在第一次查询时才建立，因此构建阶段不依赖本地 MySQL。
  const uri = process.env.DATABASE_URL ?? "mysql://invalid:invalid@127.0.0.1:3306/invalid";
  return mysql.createPool({ uri, connectionLimit: 10, enableKeepAlive: true });
}

const pool = globalForDb.mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export const db = drizzle({ client: pool });
