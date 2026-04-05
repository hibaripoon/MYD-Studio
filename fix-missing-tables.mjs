import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
const conn = await mysql.createConnection(url);

try {
  // Check which tables are missing
  const [tables] = await conn.execute('SHOW TABLES');
  const existing = tables.map(r => Object.values(r)[0]);
  console.log('Existing tables:', existing);

  // Create work_items if missing
  if (!existing.includes('work_items')) {
    console.log('Creating work_items...');
    await conn.execute(`
      CREATE TABLE work_items (
        id VARCHAR(32) PRIMARY KEY,
        taskId VARCHAR(32) NOT NULL,
        title VARCHAR(512) NOT NULL,
        description TEXT,
        status ENUM('pending','in_progress','review','done','cancelled') NOT NULL DEFAULT 'pending',
        dueDate VARCHAR(16),
        completedAt VARCHAR(32),
        evidence JSON,
        evidenceNote TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('work_items created!');
  } else {
    console.log('work_items already exists');
  }

  // Verify final tables
  const [tables2] = await conn.execute('SHOW TABLES');
  console.log('Final tables:', tables2.map(r => Object.values(r)[0]));

} catch(e) {
  console.error('Error:', e.message);
} finally {
  await conn.end();
}
