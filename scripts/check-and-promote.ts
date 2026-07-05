import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Check current enum definition
  const [cols] = await conn.query("SHOW COLUMNS FROM users LIKE 'role'");
  console.log("Current role column:", JSON.stringify(cols, null, 2));

  // Check if 'owner' is already in the enum
  const colInfo = (cols as any[])[0];
  const enumType: string = colInfo?.Type ?? "";
  console.log("Enum type:", enumType);

  if (!enumType.includes("'owner'")) {
    console.log("Adding 'owner' to enum...");
    await conn.query("ALTER TABLE users MODIFY COLUMN `role` ENUM('user', 'admin', 'owner') NOT NULL DEFAULT 'user'");
    console.log("Enum updated.");
  } else {
    console.log("'owner' already in enum.");
  }

  // Now promote the user
  const [result] = await conn.query(
    "UPDATE users SET `role` = 'owner' WHERE email = 'lesantoineiii@gmail.com'"
  );
  console.log("Update result:", result);

  const [rows] = await conn.query(
    "SELECT id, email, role FROM users WHERE email = 'lesantoineiii@gmail.com'"
  );
  console.log("User after update:", rows);

  await conn.end();
}

main().catch(console.error);
