import mysql from "mysql2/promise";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env.local")) loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const databaseUrl = new URL(process.env.DATABASE_URL);
const databaseName = databaseUrl.pathname.slice(1);

if (databaseUrl.protocol !== "mysql:") throw new Error("DATABASE_URL must use the mysql protocol");
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) throw new Error("Database name may only contain letters, numbers, and underscores");

const connection = await mysql.createConnection({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
console.log(`数据库已就绪：${databaseName}`);
await connection.end();
