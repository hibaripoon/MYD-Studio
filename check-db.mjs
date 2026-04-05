import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
const conn = await mysql.createConnection(url);
try {
  const [tables] = await conn.execute("SHOW TABLES");
  console.log('Tables:', tables.map(r => Object.values(r)[0]));
  const [cols] = await conn.execute("DESCRIBE work_items");
  console.log('\nwork_items columns:');
  cols.forEach(c => console.log(' -', c.Field, c.Type));
  const [cols2] = await conn.execute("DESCRIBE revenue_items");
  console.log('\nrevenue_items columns:');
  cols2.forEach(c => console.log(' -', c.Field, c.Type));
} catch(e) { console.error('Error:', e.message); }
finally { await conn.end(); }
