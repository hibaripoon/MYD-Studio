/**
 * cleanup-demo.mjs
 * Deletes ALL demo data from the database.
 * Keeps ONLY the app_user with id = "user_ae1" (the original admin).
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql, ne } from "drizzle-orm";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5,
  supportBigNumbers: true,
  bigNumberStrings: false,
});

const db = drizzle(pool);

async function cleanup() {
  console.log("🧹 Starting demo data cleanup...\n");

  // Delete in dependency order (children first, then parents)
  const steps = [
    { name: "activity_logs",        query: sql`DELETE FROM activity_logs` },
    { name: "task_comments",        query: sql`DELETE FROM task_comments` },
    { name: "financial_documents",  query: sql`DELETE FROM financial_documents` },
    { name: "cash_collections",     query: sql`DELETE FROM cash_collections` },
    { name: "revenue_items",        query: sql`DELETE FROM revenue_items` },
    { name: "work_items",           query: sql`DELETE FROM work_items` },
    { name: "internal_tasks",       query: sql`DELETE FROM internal_tasks` },
    { name: "tasks",                query: sql`DELETE FROM tasks` },
    { name: "customers",            query: sql`DELETE FROM customers` },
    { name: "system_settings",      query: sql`DELETE FROM system_settings` },
    // Delete all app_users EXCEPT user_ae1 (the original admin)
    { name: "app_users (non-admin)", query: sql`DELETE FROM app_users WHERE id != 'user_ae1'` },
  ];

  for (const step of steps) {
    try {
      const result = await db.execute(step.query);
      const affected = result[0]?.affectedRows ?? "?";
      console.log(`  ✅ ${step.name}: deleted ${affected} row(s)`);
    } catch (err) {
      console.error(`  ❌ ${step.name}: ${err.message}`);
    }
  }

  // Verify admin user still exists
  const [rows] = await pool.execute("SELECT id, name, phone, companyRole FROM app_users WHERE id = 'user_ae1'");
  if (rows.length > 0) {
    console.log("\n✅ Admin user preserved:");
    console.table(rows);
  } else {
    console.warn("\n⚠️  Admin user user_ae1 not found — it may not have been seeded yet.");
  }

  await pool.end();
  console.log("\n🎉 Cleanup complete.");
}

cleanup().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
