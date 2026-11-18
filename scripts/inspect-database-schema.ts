import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL as string);
const [rows] = await conn.execute('DESCRIBE users') as any;
console.log('Users table columns:');
for (const row of rows) {
  console.log(`  ${row.Field} (${row.Type}) ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} default=${row.Default}`);
}
const [tables] = await conn.execute("SHOW TABLES") as any;
console.log('\nAll tables:');
for (const t of tables) {
  console.log(' ', Object.values(t)[0]);
}
await conn.end();
