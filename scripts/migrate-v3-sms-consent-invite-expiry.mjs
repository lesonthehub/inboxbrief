/**
 * Direct SQL migration for Round 3 schema additions.
 * Adds: internationalSms, phoneCountryCode, tosAcceptedAt, tosVersion to users
 * Adds: inviteTokenExpiresAt to team_members
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(url);

const migrations = [
  // users table additions
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS internationalSms BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phoneCountryCode VARCHAR(8) DEFAULT '+1'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tosAcceptedAt TIMESTAMP NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tosVersion VARCHAR(16) NULL`,
  // team_members table additions
  `ALTER TABLE team_members ADD COLUMN IF NOT EXISTS inviteTokenExpiresAt TIMESTAMP NULL`,
];

for (const sql of migrations) {
  try {
    await conn.execute(sql);
    console.log("✅", sql.slice(0, 80));
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("⏭️  Column already exists:", sql.slice(0, 80));
    } else {
      console.error("❌", err.message, "\n   SQL:", sql);
    }
  }
}

await conn.end();
console.log("\nMigration v3 complete.");
