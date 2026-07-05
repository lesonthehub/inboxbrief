import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.query(
    "SELECT id, email, role FROM users WHERE email = 'lesantoineiii@gmail.com'"
  );
  console.log("Current user:", rows);
  await conn.end();
}

main().catch(console.error);
