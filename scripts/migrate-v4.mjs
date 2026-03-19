import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const migrations = [
  // Users table: new Round 4 columns
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phoneVerified TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS disclaimerAcceptedAt TIMESTAMP NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS disclaimerVersion VARCHAR(16) NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trialNudge5Sent TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trialNudge6Sent TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trialEndSent TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS creditsEarned INT NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS graceBriefingUsed TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS failedAuthAttempts INT NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS lockedUntil TIMESTAMP NULL`,

  // briefing_logs: add grace trigger type
  `ALTER TABLE briefing_logs MODIFY COLUMN triggerType ENUM('manual','scheduled','grace') NOT NULL DEFAULT 'manual'`,

  // phone_verifications table
  `CREATE TABLE IF NOT EXISTS phone_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    codeHash VARCHAR(64) NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    verified TINYINT(1) NOT NULL DEFAULT 0,
    attempts INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pv_userId (userId),
    INDEX idx_pv_phone (phone)
  )`,

  // audit_logs table
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    action VARCHAR(64) NOT NULL,
    metadata TEXT NULL,
    ipAddress VARCHAR(64) NULL,
    userAgent VARCHAR(512) NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_al_userId (userId),
    INDEX idx_al_action (action),
    INDEX idx_al_createdAt (createdAt)
  )`,
];

let success = 0;
let skipped = 0;
for (const sql of migrations) {
  try {
    await db.execute(sql);
    success++;
    console.log(`✅ OK: ${sql.slice(0, 60)}...`);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
      skipped++;
      console.log(`⏭  Skip (already exists): ${sql.slice(0, 60)}...`);
    } else {
      console.error(`❌ FAIL: ${sql.slice(0, 80)}`);
      console.error(err.message);
    }
  }
}

await db.end();
console.log(`\nMigration complete: ${success} applied, ${skipped} skipped.`);
