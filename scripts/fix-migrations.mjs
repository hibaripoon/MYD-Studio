// Fix drizzle migrations table - mark all migrations as applied
import mysql from 'mysql2/promise';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read DATABASE_URL from environment (injected by manus)
const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

// Get already-applied migrations
const [existing] = await conn.execute('SELECT hash FROM `__drizzle_migrations`');
const existingHashes = new Set(existing.map(r => r.hash));
console.log('Already applied:', existingHashes.size);

// Migrations to ensure are marked as applied
const migrations = [
  { tag: '0001_lyrical_robin_chapel', when: 1775372480366 },
  { tag: '0002_fat_adam_destine', when: 1775411089883 },
  { tag: '0003_dear_newton_destine', when: 1775411669362 },
  { tag: '0004_careless_anthem', when: 1775412791019 },
  { tag: '0005_breezy_spot', when: 1775466927182 },
  { tag: '0006_icy_lord_hawal', when: 1775475478666 },
];

for (const { tag, when } of migrations) {
  const sqlPath = join(projectRoot, 'drizzle', `${tag}.sql`);
  const sql = readFileSync(sqlPath, 'utf8');
  const hash = createHash('sha256').update(sql).digest('hex');
  
  if (existingHashes.has(hash)) {
    console.log(`✓ Already applied: ${tag}`);
    continue;
  }
  
  await conn.execute(
    'INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)',
    [hash, when]
  );
  console.log(`✓ Marked as applied: ${tag}`);
}

await conn.end();
console.log('Done!');
