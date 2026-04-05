import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
const conn = await mysql.createConnection(url);
try {
  // Check revenue_items columns
  const [cols] = await conn.execute("DESCRIBE revenue_items");
  console.log('revenue_items columns:');
  cols.forEach(c => console.log(' -', c.Field, c.Type));
  
  // Check all tables
  const [tables] = await conn.execute("SHOW TABLES");
  console.log('\nAll tables:', tables.map(r => Object.values(r)[0]));
  
  // Delete duplicate test task (keep ph-tCMg4 which has data)
  await conn.execute("DELETE FROM tasks WHERE id = '4mCnyH_B'");
  console.log('\nDeleted duplicate task 4mCnyH_B');
  
  // Check tasks after cleanup
  const [tasks] = await conn.execute("SELECT id, title FROM tasks");
  console.log('\nTasks after cleanup:', tasks.length);
  tasks.forEach(t => console.log(' -', t.id, '|', t.title));
} catch(e) { console.error('Error:', e.message); }
finally { await conn.end(); }
