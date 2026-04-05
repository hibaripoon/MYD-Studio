import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  appUsers, InsertAppUser,
  customers, InsertCustomer,
  tasks, InsertTask,
  workItems, InsertWorkItem,
  internalTasks, InsertInternalTask,
  cashCollections, InsertCashCollection,
  financialDocuments, InsertFinancialDocument,
  revenueItems, InsertRevenueItem,
  taskComments, InsertTaskComment,
  activityLogs, InsertActivityLog,
  systemSettings, InsertSystemSetting,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Auth Users (Manus OAuth) ─────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── App Users (AE / Customer phone-based login) ──────────────

export async function getAppUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appUsers).orderBy(appUsers.createdAt);
}

export async function getAppUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppUser(data: InsertAppUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(appUsers).values(data);
  return data;
}

export async function updateAppUser(id: string, data: Partial<Omit<InsertAppUser, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appUsers).set(data).where(eq(appUsers.id, id));
}

export async function deleteAppUser(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(appUsers).where(eq(appUsers.id, id));
}

// ─── Customers ────────────────────────────────────────────────

export async function getCustomers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customers).values(data);
  return data;
}

export async function updateCustomer(id: string, data: Partial<Omit<InsertCustomer, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customers).where(eq(customers.id, id));
}

// ─── Tasks ────────────────────────────────────────────────────

/** Attach all related child rows to a list of task rows */
async function hydrateTasks(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, taskRows: (typeof tasks.$inferSelect)[]) {
  if (taskRows.length === 0) return [];
  const ids = taskRows.map((t) => t.id);

  const [wItems, iItems, ccs, fDocs, rItems, comments, logs] = await Promise.all([
    db.select().from(workItems).where(inArray(workItems.taskId, ids)).orderBy(workItems.createdAt),
    db.select().from(internalTasks).where(inArray(internalTasks.taskId, ids)).orderBy(internalTasks.createdAt),
    db.select().from(cashCollections).where(inArray(cashCollections.taskId, ids)),
    db.select().from(financialDocuments).where(inArray(financialDocuments.taskId, ids)).orderBy(financialDocuments.createdAt),
    db.select().from(revenueItems).where(inArray(revenueItems.taskId, ids)).orderBy(revenueItems.createdAt),
    db.select().from(taskComments).where(inArray(taskComments.taskId, ids)).orderBy(taskComments.createdAt),
    db.select().from(activityLogs).where(inArray(activityLogs.taskId, ids)).orderBy(activityLogs.createdAt),
  ]);

  return taskRows.map((task) => ({
    ...task,
    _workItems: wItems.filter((w) => w.taskId === task.id),
    _internalTasks: iItems.filter((i) => i.taskId === task.id),
    _cashCollection: ccs.filter((c) => c.taskId === task.id),
    _financialDocs: fDocs.filter((d) => d.taskId === task.id),
    _revenueItems: rItems.filter((r) => r.taskId === task.id),
    _comments: comments.filter((c) => c.taskId === task.id),
    _activityLogs: logs.filter((l) => l.taskId === task.id),
  }));
}

export async function getTasks() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return hydrateTasks(db, rows);
}

export async function getTasksByCustomer(customerId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(tasks).where(eq(tasks.customerId, customerId)).orderBy(desc(tasks.createdAt));
  return hydrateTasks(db, rows);
}

export async function getTaskById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (result.length === 0) return undefined;
  const hydrated = await hydrateTasks(db, result);
  return hydrated[0];
}

export async function getTaskByIdempotencyKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.idempotencyKey, key)).limit(1);
  if (result.length === 0) return undefined;
  const hydrated = await hydrateTasks(db, result);
  return hydrated[0];
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tasks).values(data);
  return data;
}

export async function updateTask(id: string, data: Partial<Omit<InsertTask, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
}

export async function deleteTask(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Work Items ───────────────────────────────────────────────

export async function getWorkItemsByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workItems).where(eq(workItems.taskId, taskId)).orderBy(workItems.createdAt);
}

export async function createWorkItem(data: InsertWorkItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workItems).values(data);
  return data;
}

export async function updateWorkItem(id: string, data: Partial<Omit<InsertWorkItem, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workItems).set({ ...data, updatedAt: new Date() }).where(eq(workItems.id, id));
}

export async function deleteWorkItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workItems).where(eq(workItems.id, id));
}

// ─── Internal Tasks ───────────────────────────────────────────

export async function getInternalTasksByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(internalTasks).where(eq(internalTasks.taskId, taskId)).orderBy(internalTasks.createdAt);
}

export async function createInternalTask(data: InsertInternalTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(internalTasks).values(data);
  return data;
}

export async function updateInternalTask(id: string, data: Partial<Omit<InsertInternalTask, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(internalTasks).set({ ...data, updatedAt: new Date() }).where(eq(internalTasks.id, id));
}

export async function deleteInternalTask(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(internalTasks).where(eq(internalTasks.id, id));
}

// ─── Cash Collections ─────────────────────────────────────────

export async function getCashCollectionByTask(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cashCollections).where(eq(cashCollections.taskId, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCashCollection(data: InsertCashCollection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cashCollections).values(data).onDuplicateKeyUpdate({
    set: {
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      paidDate: data.paidDate,
      collectedAmount: data.collectedAmount,
      note: data.note,
      updatedAt: new Date(),
    }
  });
}

// ─── Financial Documents ──────────────────────────────────────

export async function getFinancialDocsByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(financialDocuments).where(eq(financialDocuments.taskId, taskId)).orderBy(financialDocuments.createdAt);
}

export async function createFinancialDocument(data: InsertFinancialDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(financialDocuments).values(data);
  return data;
}

export async function deleteFinancialDocument(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(financialDocuments).where(eq(financialDocuments.id, id));
}

// ─── Revenue Items ────────────────────────────────────────────

export async function getRevenueItemsByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(revenueItems).where(eq(revenueItems.taskId, taskId)).orderBy(revenueItems.createdAt);
}

export async function getAllRevenueItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(revenueItems).orderBy(desc(revenueItems.createdAt));
}

export async function createRevenueItem(data: InsertRevenueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(revenueItems).values(data);
  return data;
}

export async function updateRevenueItem(id: string, data: Partial<Omit<InsertRevenueItem, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(revenueItems).set({ ...data, updatedAt: new Date() }).where(eq(revenueItems.id, id));
}

export async function deleteRevenueItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(revenueItems).where(eq(revenueItems.id, id));
}

// ─── Task Comments ────────────────────────────────────────────

export async function getCommentsByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(taskComments.createdAt);
}

export async function createComment(data: InsertTaskComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(taskComments).values(data);
  return data;
}

export async function deleteComment(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(taskComments).where(eq(taskComments.id, id));
}

// ─── Activity Logs ────────────────────────────────────────────

export async function getActivityLogsByTask(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(activityLogs.createdAt);
}

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

// ─── System Settings ──────────────────────────────────────────

const DEFAULT_SETTINGS = {
  companyName: "MediaFlow",
  mediaItems: ["Facebook Page", "Instagram", "TikTok", "YouTube", "Line OA", "Google Ads"],
  productItems: ["ถ่ายภาพ", "ตัดต่อวิดีโอ", "Graphic Design", "Content Writing", "KOL/Influencer", "Live Streaming"],
};

export async function getSettings() {
  const db = await getDb();
  if (!db) return DEFAULT_SETTINGS;
  const rows = await db.select().from(systemSettings);
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => { result[row.key] = row.value; });
  return result as typeof DEFAULT_SETTINGS;
}

export async function setSetting(key: string, value: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(systemSettings).values({ key, value } as InsertSystemSetting)
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
}

// ─── Seed helpers ─────────────────────────────────────────────

export async function seedIfEmpty() {
  const db = await getDb();
  if (!db) return;

  const existingUsers = await db.select().from(appUsers).limit(1);
  if (existingUsers.length > 0) return; // Already seeded

  const { nanoid } = await import("nanoid");

  // Seed App Users
  const seedUsers: InsertAppUser[] = [
    { id: "user_ae1", phone: "0812345001", password: "ae1234", role: "company", companyRole: "admin", name: "ปิยะ สมบูรณ์", avatarInitials: "ปส", avatarColor: "bg-blue-500", aeId: "ae1", email: "piya@mediacompany.co.th" },
    { id: "user_ae2", phone: "0812345002", password: "ae1234", role: "company", companyRole: "head", name: "นภา วงศ์ดี", avatarInitials: "นว", avatarColor: "bg-purple-500", aeId: "ae2", email: "napa@mediacompany.co.th" },
    { id: "user_ae3", phone: "0812345003", password: "ae1234", role: "company", companyRole: "ae", name: "ธนา รักษ์ไทย", avatarInitials: "ธร", avatarColor: "bg-teal-500", aeId: "ae3", email: "tana@mediacompany.co.th" },
    { id: "user_cust1", phone: "0812345678", password: "cust1234", role: "customer", name: "คุณสมชาย ใจดี", avatarInitials: "สช", avatarColor: "bg-emerald-500", customerId: "cust1" },
    { id: "user_cust2", phone: "0898765432", password: "cust1234", role: "customer", name: "คุณนิดา พงษ์ไพร", avatarInitials: "นพ", avatarColor: "bg-pink-500", customerId: "cust2" },
    { id: "user_cust3", phone: "0255512345", password: "cust1234", role: "customer", name: "คุณวิชัย ตั้งมั่น", avatarInitials: "วต", avatarColor: "bg-violet-500", customerId: "cust3" },
    { id: "user_cust4", phone: "0901112222", password: "cust1234", role: "customer", name: "คุณพรทิพย์ ศรีสวัสดิ์", avatarInitials: "พศ", avatarColor: "bg-blue-500", customerId: "cust4" },
    { id: "user_cust5", phone: "0834445555", password: "cust1234", role: "customer", name: "คุณอนุชา มีสุข", avatarInitials: "อม", avatarColor: "bg-orange-500", customerId: "cust5" },
  ];
  for (const u of seedUsers) await db.insert(appUsers).values(u).onDuplicateKeyUpdate({ set: { name: u.name } });

  // Seed Customers
  const seedCustomers: InsertCustomer[] = [
    { id: "cust1", brandName: "ร้านอาหารไทยใจดี", type: "SME", contactName: "คุณสมชาย ใจดี", contactPhone: "0812345678", contactEmail: "somchai@thaifood.co.th", taxCompanyName: "ร้านอาหารไทยใจดี", taxAddress: "123 ถ.สุขุมวิท กรุงเทพฯ 10110", taxId: "0105555012345", avatarInitials: "รท", avatarColor: "bg-emerald-500" },
    { id: "cust2", brandName: "Beauty Brand Thailand", type: "Brand", contactName: "คุณนิดา พงษ์ไพร", contactPhone: "0898765432", contactEmail: "nida@beautybrand.com", avatarInitials: "บท", avatarColor: "bg-pink-500" },
    { id: "cust3", brandName: "Creative Ad Agency", type: "Agency", contactName: "คุณวิชัย ตั้งมั่น", contactPhone: "025551234", contactEmail: "wichai@adagency.co.th", avatarInitials: "ซอ", avatarColor: "bg-violet-500" },
    { id: "cust4", brandName: "TechBrand Co., Ltd.", type: "Brand", contactName: "คุณพรทิพย์ ศรีสวัสดิ์", contactPhone: "0901112222", contactEmail: "porntip@techbrand.com", taxCompanyName: "เทคแบรนด์ จำกัด", taxAddress: "456 ถ.พระราม 9 กรุงเทพฯ 10310", taxId: "0105566023456", avatarInitials: "ทบ", avatarColor: "bg-blue-500" },
    { id: "cust5", brandName: "Local Shop Online", type: "SME", contactName: "คุณอนุชา มีสุข", contactPhone: "0834445555", contactEmail: "anucha@localshop.com", avatarInitials: "ลช", avatarColor: "bg-orange-500" },
  ];
  for (const c of seedCustomers) await db.insert(customers).values(c).onDuplicateKeyUpdate({ set: { brandName: c.brandName } });

  // Seed Tasks
  const seedTasks: InsertTask[] = [
    { id: "task1", customerId: "cust1", title: "แคมเปญ Social Media Q2/2025", contactName: "คุณสมชาย ใจดี", contactPhone: "0812345678", contactEmail: "somchai@thaifood.co.th", aeId: "user_ae1", aeName: "ปิยะ สมบูรณ์", status: "in_progress", brief: "โปรโมทร้านอาหารผ่าน Facebook และ Instagram เน้นเมนูใหม่ช่วงซัมเมอร์" },
    { id: "task2", customerId: "cust2", title: "Launch Campaign ผลิตภัณฑ์ใหม่ Beauty Brand", contactName: "คุณนิดา พงษ์ไพร", contactPhone: "0898765432", contactEmail: "nida@beautybrand.com", aeId: "user_ae2", aeName: "นภา วงศ์ดี", status: "review", brief: "Launch ผลิตภัณฑ์ Serum ใหม่ ต้องการ KOL review, ลง TikTok และ YouTube" },
    { id: "task3", customerId: "cust3", title: "Manage Social Media รายเดือน - Creative Agency", contactName: "คุณวิชัย ตั้งมั่น", contactPhone: "025551234", contactEmail: "wichai@adagency.co.th", aeId: "user_ae1", aeName: "ปิยะ สมบูรณ์", status: "in_progress", brief: "ดูแล Social Media ทุก Platform รายเดือน" },
    { id: "task4", customerId: "cust4", title: "Google Ads Campaign - TechBrand", contactName: "คุณพรทิพย์ ศรีสวัสดิ์", contactPhone: "0901112222", contactEmail: "porntip@techbrand.com", aeId: "user_ae3", aeName: "ธนา รักษ์ไทย", status: "pending", brief: "ยิง Google Search Ads และ Display Ads" },
    { id: "task5", customerId: "cust5", title: "สร้าง Line OA และ Content", contactName: "คุณอนุชา มีสุข", contactPhone: "0834445555", contactEmail: "anucha@localshop.com", aeId: "user_ae2", aeName: "นภา วงศ์ดี", status: "done", brief: "สร้าง Line Official Account และทำ Content" },
  ];
  for (const t of seedTasks) await db.insert(tasks).values(t).onDuplicateKeyUpdate({ set: { title: t.title } });

  // Seed Cash Collections
  const seedCC: InsertCashCollection[] = [
    { id: "cc1", taskId: "task1", amount: "35000", currency: "THB", status: "partial", invoiceNumber: "INV-2025-001", invoiceDate: "2025-04-01", dueDate: "2025-04-30", note: "รับมัดจำ 50% แล้ว" },
    { id: "cc2", taskId: "task2", amount: "120000", currency: "THB", status: "invoiced", invoiceNumber: "INV-2025-002", invoiceDate: "2025-03-15", dueDate: "2025-04-15", note: "ส่ง Invoice แล้ว รอลูกค้าโอน" },
    { id: "cc3", taskId: "task3", amount: "25000", currency: "THB", status: "paid", invoiceNumber: "INV-2025-003", invoiceDate: "2025-04-01", dueDate: "2025-04-10", paidDate: "2025-04-08", note: "ชำระแล้วเต็มจำนวน" },
    { id: "cc4", taskId: "task4", amount: "45000", currency: "THB", status: "unpaid", dueDate: "2025-04-20", note: "รอส่ง Invoice" },
    { id: "cc5", taskId: "task5", amount: "18000", currency: "THB", status: "paid", invoiceNumber: "INV-2025-004", invoiceDate: "2025-02-01", dueDate: "2025-02-28", paidDate: "2025-02-25", note: "ชำระครบแล้ว" },
  ];
  for (const cc of seedCC) await db.insert(cashCollections).values(cc).onDuplicateKeyUpdate({ set: { status: cc.status } });

  // Seed Revenue Items
  const seedRevenue: InsertRevenueItem[] = [
    { id: "ri1", taskId: "task1", mediaName: "Facebook Page", productType: "ถ่ายภาพ", amount: "15000" },
    { id: "ri2", taskId: "task1", mediaName: "Instagram", productType: "Graphic Design", amount: "20000" },
    { id: "ri3", taskId: "task2", mediaName: "TikTok", productType: "KOL/Influencer", amount: "60000" },
    { id: "ri4", taskId: "task2", mediaName: "YouTube", productType: "ตัดต่อวิดีโอ", amount: "60000" },
    { id: "ri5", taskId: "task3", mediaName: "Facebook Page", productType: "Content Writing", amount: "15000" },
    { id: "ri6", taskId: "task3", mediaName: "Instagram", productType: "Graphic Design", amount: "10000" },
    { id: "ri7", taskId: "task4", mediaName: "Google Ads", productType: "Graphic Design", amount: "45000" },
    { id: "ri8", taskId: "task5", mediaName: "Line OA", productType: "Content Writing", amount: "18000" },
  ];
  for (const ri of seedRevenue) await db.insert(revenueItems).values(ri).onDuplicateKeyUpdate({ set: { amount: ri.amount } });

  // Seed Work Items
  const seedWorkItems: InsertWorkItem[] = [
    { id: "w1", taskId: "task1", title: "ลง Post Facebook 4 ชิ้น", description: "โพสต์เมนูใหม่ทุกสัปดาห์", status: "done", dueDate: "2025-04-07", completedAt: "2025-04-06" },
    { id: "w2", taskId: "task1", title: "ยิง Ads Facebook Boost", description: "Budget 5,000 บาท", status: "in_progress", dueDate: "2025-04-30" },
    { id: "w3", taskId: "task1", title: "ลง Instagram Reels 2 ชิ้น", description: "วิดีโอสั้น 30 วินาที", status: "pending", dueDate: "2025-04-25" },
    { id: "w4", taskId: "task2", title: "จัด KOL Review 3 คน", description: "ติดต่อ KOL ระดับ Micro-Influencer", status: "done", dueDate: "2025-03-31", completedAt: "2025-03-28" },
    { id: "w5", taskId: "task2", title: "ทำ TikTok Video 5 ชิ้น", description: "วิดีโอ How-to use Serum", status: "review", dueDate: "2025-04-15" },
    { id: "w6", taskId: "task2", title: "Gen Landing Page Code", description: "หน้า Landing Page", status: "done", dueDate: "2025-04-10", completedAt: "2025-04-09" },
    { id: "w7", taskId: "task3", title: "โพสต์ Facebook เดือน เม.ย.", description: "12 โพสต์ต่อเดือน", status: "in_progress", dueDate: "2025-04-30" },
    { id: "w8", taskId: "task3", title: "Monthly Report เดือน มี.ค.", description: "รายงานผล Engagement", status: "done", dueDate: "2025-04-05", completedAt: "2025-04-04" },
    { id: "w9", taskId: "task4", title: "Setup Google Ads Account", description: "ตั้งค่า Campaign, Ad Groups", status: "pending", dueDate: "2025-04-20" },
    { id: "w10", taskId: "task4", title: "ออกแบบ Banner Ads", description: "Banner ขนาดต่างๆ", status: "pending", dueDate: "2025-04-22" },
    { id: "w11", taskId: "task5", title: "Setup Line OA", description: "สร้างและตั้งค่า Line OA", status: "done", dueDate: "2025-01-31", completedAt: "2025-01-28" },
    { id: "w12", taskId: "task5", title: "ทำ Content 10 ชิ้น", description: "Content สำหรับโปรโมทสินค้า", status: "done", dueDate: "2025-02-28", completedAt: "2025-02-25" },
  ];
  for (const wi of seedWorkItems) await db.insert(workItems).values(wi).onDuplicateKeyUpdate({ set: { title: wi.title } });

  // Seed Internal Tasks
  const seedInternalTasks: InsertInternalTask[] = [
    { id: "it1", taskId: "task1", title: "ตามบรีฟเพิ่มเติมจากลูกค้า", done: true, completedAt: "2025-04-02" },
    { id: "it2", taskId: "task1", title: "ไปถ่ายภาพอาหารที่ร้าน", done: true, completedAt: "2025-04-04" },
    { id: "it3", taskId: "task1", title: "ส่ง Content Plan ให้ลูกค้า Approve", done: false },
    { id: "it4", taskId: "task2", title: "ประสานงาน KOL ส่งสินค้า", done: true, completedAt: "2025-03-20" },
    { id: "it5", taskId: "task2", title: "Review TikTok ก่อนโพสต์", done: false },
    { id: "it6", taskId: "task3", title: "วางแผน Content เดือนหน้า", done: false },
    { id: "it7", taskId: "task4", title: "ขอ Access Google Ads Account จากลูกค้า", done: false },
  ];
  for (const it of seedInternalTasks) await db.insert(internalTasks).values(it).onDuplicateKeyUpdate({ set: { title: it.title } });

  console.log("[Seed] Database seeded successfully");
}
