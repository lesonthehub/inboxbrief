import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load env from .env file
try {
  const envContent = readFileSync("/home/ubuntu/inboxbrief/.env", "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.DATABASE_URL;
if (!url) { console.error("No DATABASE_URL"); process.exit(1); }

const conn = await mysql.createConnection(url);
const [rows] = await conn.execute(
  "SELECT id, openId, name, email, role, loginMethod, emailVerified, lastSignedIn FROM users WHERE email = 'lesantoineiii@gmail.com'"
);
console.log(JSON.stringify(rows, null, 2));
await conn.end();
