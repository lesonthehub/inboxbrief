/**
 * Direct SQL migration for InboxBrief v2 schema changes.
 * Applies all new columns and tables without interactive drizzle-kit prompts.
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(url);
console.log("✅ Connected to database");

const migrations = [
  // Drop old columns no longer in schema
  `ALTER TABLE users DROP COLUMN IF EXISTS emailVolume`,
  `ALTER TABLE users DROP COLUMN IF EXISTS primaryGoal`,
  `ALTER TABLE users DROP COLUMN IF EXISTS businessType`,

  // Add new user columns
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS businessType VARCHAR(128)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS userRole ENUM('solo_owner','team_lead','executive','operations','other')`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS teamSize ENUM('just_me','2_5','6_15','16_plus')`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS inboxChallenge ENUM('missing_leads','client_follow_up','too_much_volume','team_coordination')`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'en'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS toneStyle ENUM('concise','conversational','detailed') NOT NULL DEFAULT 'conversational'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS keywordsInclude TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS keywordsExclude TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referralCode VARCHAR(16) UNIQUE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referredByCode VARCHAR(16)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS referralCredits INT NOT NULL DEFAULT 0`,

  // Update subscriptions plan enum to include new tiers
  `ALTER TABLE subscriptions MODIFY COLUMN plan ENUM('trial','solo','pro','business','enterprise') NOT NULL DEFAULT 'trial'`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS seatCount INT NOT NULL DEFAULT 1`,

  // Update briefing_logs plan enum
  `ALTER TABLE briefing_logs MODIFY COLUMN planAtTime ENUM('trial','solo','pro','business','enterprise') NOT NULL DEFAULT 'trial'`,
  `ALTER TABLE briefing_logs ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'en'`,

  // Create team_members table
  `CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ownerId INT NOT NULL,
    memberId INT,
    inviteEmail VARCHAR(320) NOT NULL,
    inviteToken VARCHAR(64) UNIQUE,
    status ENUM('pending','active','removed') NOT NULL DEFAULT 'pending',
    phone VARCHAR(32),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Create referral_uses table
  `CREATE TABLE IF NOT EXISTS referral_uses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrerId INT NOT NULL,
    referredUserId INT NOT NULL,
    creditAwarded INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create briefing_feedback table
  `CREATE TABLE IF NOT EXISTS briefing_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    briefingLogId INT NOT NULL,
    rating INT NOT NULL,
    toneAdjustment ENUM('more_concise','more_detail','more_casual','more_formal','perfect'),
    addKeywords TEXT,
    removeKeywords TEXT,
    freeformNote TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

let success = 0;
let skipped = 0;

for (const sql of migrations) {
  const label = sql.substring(0, 80).replace(/\s+/g, " ").trim();
  try {
    await conn.execute(sql);
    console.log(`  ✅ ${label}...`);
    success++;
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR" || err.message.includes("Duplicate column")) {
      console.log(`  ⏭️  Already exists: ${label.substring(0, 60)}...`);
      skipped++;
    } else {
      console.error(`  ❌ FAILED: ${label}`);
      console.error(`     Error: ${err.message}`);
    }
  }
}

await conn.end();
console.log(`\n✅ Migration complete: ${success} applied, ${skipped} skipped`);
