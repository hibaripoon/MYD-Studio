/**
 * Cleanup script: remove duplicate test tasks and fix "xxx" revenue items
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await createConnection(process.env.DATABASE_URL);

try {
  // 1. Find duplicate test tasks (created during testing)
  const [tasks] = await conn.execute("SELECT id, title, createdAt FROM tasks ORDER BY createdAt ASC");
  console.log("All tasks:", tasks.map(t => `${t.id}: ${t.title}`));

  // 2. Remove the first test task (4mCnyH_B) - keep the second one (ph-tCMg4) which has work items
  const [workItems] = await conn.execute("SELECT taskId, COUNT(*) as cnt FROM work_items GROUP BY taskId");
  console.log("Work items per task:", workItems);

  // Delete the empty duplicate test task
  const [result] = await conn.execute(
    "DELETE FROM tasks WHERE id = '4mCnyH_B'"
  );
  console.log("Deleted duplicate task 4mCnyH_B:", result.affectedRows, "rows");

  // 3. Fix "xxx" revenue items - update mediaName and productType
  const [xxxItems] = await conn.execute(
    "SELECT id, mediaName, productType, amount FROM revenue_items WHERE mediaName = 'xxx' OR productType = 'xxx'"
  );
  console.log("xxx revenue items:", xxxItems);

  // Update xxx mediaName to proper values based on seed data
  const mediaFixes = [
    { taskId: null, oldMedia: "xxx", newMedia: "Facebook Page" },
  ];

  // Get all revenue items with xxx
  for (const item of xxxItems) {
    if (item.mediaName === "xxx") {
      await conn.execute("UPDATE revenue_items SET mediaName = 'Facebook Page' WHERE id = ?", [item.id]);
      console.log(`Fixed mediaName for item ${item.id}: xxx -> Facebook Page`);
    }
    if (item.productType === "xxx") {
      await conn.execute("UPDATE revenue_items SET productType = 'Graphic Design' WHERE id = ?", [item.id]);
      console.log(`Fixed productType for item ${item.id}: xxx -> Graphic Design`);
    }
  }

  // 4. Check final state
  const [finalTasks] = await conn.execute("SELECT id, title FROM tasks ORDER BY createdAt ASC");
  console.log("\nFinal tasks:", finalTasks.map(t => `${t.id}: ${t.title}`));

  const [finalRevenue] = await conn.execute("SELECT id, taskId, mediaName, productType, amount FROM revenue_items");
  console.log("\nFinal revenue items:", finalRevenue);

} catch (err) {
  console.error("Error:", err.message);
} finally {
  await conn.end();
}
