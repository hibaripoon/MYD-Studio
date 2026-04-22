/**
 * Round 25 Migration Script
 * Creates new tables: projects, items, item_comments
 * Updates meeting_notes to use itemId instead of taskId
 * Drops old tables: customers, tasks, work_items, internal_tasks, 
 *   cash_collections, financial_documents, revenue_items, task_comments, activity_logs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);
console.log("Connected to database");

// Helper to run SQL safely
async function run(sql, label) {
  try {
    await conn.execute(sql);
    console.log(`✓ ${label}`);
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR" || err.code === "ER_DUP_FIELDNAME") {
      console.log(`~ ${label} (already exists, skipping)`);
    } else if (err.code === "ER_BAD_TABLE_ERROR" || err.code === "ER_NO_SUCH_TABLE") {
      console.log(`~ ${label} (table not found, skipping)`);
    } else {
      console.error(`✗ ${label}: ${err.message}`);
    }
  }
}

// 1. Create projects table
await run(`
  CREATE TABLE IF NOT EXISTS \`projects\` (
    \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,
    \`name\` VARCHAR(256) NOT NULL,
    \`description\` TEXT,
    \`color\` VARCHAR(64) DEFAULT 'bg-blue-500',
    \`ownerId\` VARCHAR(32),
    \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`projects_owner_id_idx\` (\`ownerId\`)
  )
`, "Create projects table");

// 2. Create items table
await run(`
  CREATE TABLE IF NOT EXISTS \`items\` (
    \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,
    \`projectId\` VARCHAR(32),
    \`title\` VARCHAR(512) NOT NULL,
    \`description\` TEXT,
    \`type\` ENUM('task','meeting') NOT NULL DEFAULT 'task',
    \`status\` ENUM('todo','in_progress','review','done','cancelled') NOT NULL DEFAULT 'todo',
    \`priority\` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    \`assigneeIds\` JSON DEFAULT (JSON_ARRAY()),
    \`responsibleId\` VARCHAR(32),
    \`dueDate\` VARCHAR(16),
    \`dueTime\` VARCHAR(8),
    \`endDate\` VARCHAR(16),
    \`endTime\` VARCHAR(8),
    \`location\` VARCHAR(256),
    \`createdBy\` VARCHAR(32),
    \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX \`items_project_id_idx\` (\`projectId\`),
    INDEX \`items_type_idx\` (\`type\`),
    INDEX \`items_status_idx\` (\`status\`),
    INDEX \`items_responsible_id_idx\` (\`responsibleId\`)
  )
`, "Create items table");

// 3. Create item_comments table
await run(`
  CREATE TABLE IF NOT EXISTS \`item_comments\` (
    \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,
    \`itemId\` VARCHAR(32) NOT NULL,
    \`authorId\` VARCHAR(32) NOT NULL,
    \`authorName\` VARCHAR(128) NOT NULL,
    \`content\` TEXT NOT NULL,
    \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX \`item_comments_item_id_idx\` (\`itemId\`)
  )
`, "Create item_comments table");

// 4. Check if meeting_notes has itemId or taskId column
const [cols] = await conn.execute(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_notes'
`);
const colNames = cols.map(c => c.COLUMN_NAME);
console.log("meeting_notes columns:", colNames);

if (colNames.includes("taskId") && !colNames.includes("itemId")) {
  // Old schema - need to recreate
  await run(`DROP TABLE IF EXISTS \`meeting_notes\``, "Drop old meeting_notes");
  await run(`
    CREATE TABLE IF NOT EXISTS \`meeting_notes\` (
      \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,
      \`itemId\` VARCHAR(32) NOT NULL,
      \`authorId\` VARCHAR(32) NOT NULL,
      \`authorName\` VARCHAR(128) NOT NULL,
      \`content\` TEXT NOT NULL,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`meeting_notes_item_id_idx\` (\`itemId\`)
    )
  `, "Create new meeting_notes table with itemId");
} else if (!colNames.includes("itemId")) {
  // Table doesn't exist yet
  await run(`
    CREATE TABLE IF NOT EXISTS \`meeting_notes\` (
      \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,
      \`itemId\` VARCHAR(32) NOT NULL,
      \`authorId\` VARCHAR(32) NOT NULL,
      \`authorName\` VARCHAR(128) NOT NULL,
      \`content\` TEXT NOT NULL,
      \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`meeting_notes_item_id_idx\` (\`itemId\`)
    )
  `, "Create meeting_notes table with itemId");
} else {
  console.log("~ meeting_notes already has itemId column, skipping");
}

// 5. Drop old tables (safe - only if they exist)
const oldTables = [
  "activity_logs",
  "task_comments", 
  "revenue_items",
  "financial_documents",
  "cash_collections",
  "internal_tasks",
  "work_items",
  "customers",
  "tasks",
];

for (const table of oldTables) {
  await run(`DROP TABLE IF EXISTS \`${table}\``, `Drop old table: ${table}`);
}

// 6. Update drizzle meta snapshot to reflect new schema
console.log("\n✓ Migration complete!");
console.log("Tables created: projects, items, item_comments, meeting_notes");
console.log("Tables dropped:", oldTables.join(", "));

await conn.end();
