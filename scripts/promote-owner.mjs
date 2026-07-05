import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const email = "lesantoineiii@gmail.com";

// Check current role
const [current] = await db.select({ id: users.id, email: users.email, role: users.role })
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

if (!current) {
  console.log(`User ${email} not found in database.`);
  process.exit(1);
}

console.log(`Found user: id=${current.id}, email=${current.email}, current role=${current.role}`);

await db.update(users).set({ role: "owner" }).where(eq(users.id, current.id));

const [updated] = await db.select({ id: users.id, email: users.email, role: users.role })
  .from(users)
  .where(eq(users.id, current.id))
  .limit(1);

console.log(`Updated: id=${updated.id}, email=${updated.email}, new role=${updated.role}`);
await connection.end();
