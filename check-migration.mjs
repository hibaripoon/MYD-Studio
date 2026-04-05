import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
console.log('DB URL present:', !!url);

if (!url) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}

const connection = await mysql.createConnection(url);
const db = drizzle(connection);

try {
  const [rows] = await connection.execute("SHOW TABLES");
  console.log('Tables in DB:');
  rows.forEach(r => console.log(' -', Object.values(r)[0]));
} catch(e) {
  console.error('Error:', e.message);
} finally {
  await connection.end();
}
