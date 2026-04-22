import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import {
  InsertUser, users,
  appUsers, InsertAppUser,
  projects, InsertProject,
  items, InsertItem,
  itemComments, InsertItemComment,
  meetingNotes, InsertMeetingNote,
  systemSettings, InsertSystemSetting,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = createPool({
        uri: process.env.DATABASE_URL,
        supportBigNumbers: true,
        bigNumberStrings: false,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      _db = drizzle(pool);
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

// ─── App Users ────────────────────────────────────────────────

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

// ─── Projects ─────────────────────────────────────────────────

export async function getProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projects).values(data);
  return data;
}

export async function updateProject(id: string, data: Partial<Omit<InsertProject, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id));
}

export async function deleteProject(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── Items (Tasks & Meetings) ─────────────────────────────────

export async function getItems(projectId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return db.select().from(items).where(eq(items.projectId, projectId)).orderBy(desc(items.createdAt));
  }
  return db.select().from(items).orderBy(desc(items.createdAt));
}

export async function getItemsByType(type: "task" | "meeting") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(items).where(eq(items.type, type)).orderBy(desc(items.createdAt));
}

export async function getItemById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createItem(data: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(items).values(data);
  return data;
}

export async function updateItem(id: string, data: Partial<Omit<InsertItem, 'id'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(items).set({ ...data, updatedAt: new Date() }).where(eq(items.id, id));
}

export async function deleteItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(items).where(eq(items.id, id));
}

// ─── Item Comments ────────────────────────────────────────────

export async function getCommentsByItem(itemId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(itemComments).where(eq(itemComments.itemId, itemId)).orderBy(itemComments.createdAt);
}

export async function createItemComment(data: InsertItemComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(itemComments).values(data);
  const rows = await db.select().from(itemComments).where(eq(itemComments.id, data.id as string)).limit(1);
  return rows[0] ?? null;
}

export async function deleteItemComment(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(itemComments).where(eq(itemComments.id, id));
}

// ─── Meeting Notes ────────────────────────────────────────────

export async function getMeetingNotesByItem(itemId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingNotes).where(eq(meetingNotes.itemId, itemId)).orderBy(meetingNotes.createdAt);
}

export async function createMeetingNote(data: InsertMeetingNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(meetingNotes).values(data);
  const rows = await db.select().from(meetingNotes).where(eq(meetingNotes.id, data.id as string)).limit(1);
  return rows[0] ?? null;
}

export async function deleteMeetingNote(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
}

// ─── System Settings ──────────────────────────────────────────

const DEFAULT_SETTINGS = {
  companyName: "MYD Studio",
  companyLogo: "",
  primaryColor: "#3b82f6",
  mediaItems: [] as string[],
  productItems: [] as string[],
};

export async function getSettings() {
  const db = await getDb();
  if (!db) return DEFAULT_SETTINGS;
  const rows = await db.select().from(systemSettings);
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  rows.forEach((row) => { result[row.key] = row.value; });
  // Parse JSON arrays stored as strings
  if (typeof result.mediaItems === 'string') {
    try { result.mediaItems = JSON.parse(result.mediaItems as string); } catch { result.mediaItems = []; }
  }
  if (typeof result.productItems === 'string') {
    try { result.productItems = JSON.parse(result.productItems as string); } catch { result.productItems = []; }
  }
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

  // Seed App Users (internal staff)
  const seedUsers: InsertAppUser[] = [
    { id: "user_ae1", phone: "0812345001", password: "ae1234", role: "company", companyRole: "admin", name: "ปิยะ สมบูรณ์", avatarInitials: "ปส", avatarColor: "bg-blue-500", aeId: "ae1", email: "piya@company.co.th" },
    { id: "user_ae2", phone: "0812345002", password: "ae1234", role: "company", companyRole: "head", name: "นภา วงศ์ดี", avatarInitials: "นว", avatarColor: "bg-purple-500", aeId: "ae2", email: "napa@company.co.th" },
    { id: "user_ae3", phone: "0812345003", password: "ae1234", role: "company", companyRole: "ae", name: "ธนา รักษ์ไทย", avatarInitials: "ธร", avatarColor: "bg-teal-500", aeId: "ae3", email: "tana@company.co.th" },
  ];
  for (const u of seedUsers) await db.insert(appUsers).values(u).onDuplicateKeyUpdate({ set: { name: u.name } });

  // Seed Projects
  const seedProjects: InsertProject[] = [
    { id: "proj1", name: "Q2 Campaign 2025", description: "แคมเปญไตรมาส 2 ปี 2025", color: "bg-blue-500", ownerId: "user_ae1" },
    { id: "proj2", name: "Brand Refresh", description: "รีแบรนด์ภาพลักษณ์องค์กร", color: "bg-purple-500", ownerId: "user_ae2" },
    { id: "proj3", name: "Social Media Management", description: "จัดการ Social Media รายเดือน", color: "bg-teal-500", ownerId: "user_ae3" },
  ];
  for (const p of seedProjects) await db.insert(projects).values(p).onDuplicateKeyUpdate({ set: { name: p.name } });

  // Seed Items (Tasks + Meetings)
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const seedItems: InsertItem[] = [
    { id: "item1", projectId: "proj1", title: "ออกแบบ Banner โฆษณา", description: "ออกแบบ Banner สำหรับ Facebook และ Instagram", type: "task", status: "in_progress", priority: "high", assigneeIds: ["user_ae3"], responsibleId: "user_ae1", dueDate: fmt(addDays(today, 3)) },
    { id: "item2", projectId: "proj1", title: "เขียน Copy โฆษณา", description: "เขียน Copy สำหรับ Ad Campaign", type: "task", status: "todo", priority: "medium", assigneeIds: ["user_ae2"], responsibleId: "user_ae2", dueDate: fmt(addDays(today, 5)) },
    { id: "item3", projectId: "proj1", title: "ประชุม Kick-off Q2 Campaign", description: "ประชุมเริ่มต้นโปรเจค Q2", type: "meeting", status: "done", priority: "high", assigneeIds: ["user_ae1", "user_ae2", "user_ae3"], responsibleId: "user_ae1", dueDate: fmt(addDays(today, -2)), dueTime: "10:00", endDate: fmt(addDays(today, -2)), endTime: "11:30" },
    { id: "item4", projectId: "proj2", title: "วิเคราะห์ Brand Identity เดิม", description: "ศึกษาและวิเคราะห์ภาพลักษณ์ปัจจุบัน", type: "task", status: "review", priority: "high", assigneeIds: ["user_ae2"], responsibleId: "user_ae2", dueDate: fmt(addDays(today, 1)) },
    { id: "item5", projectId: "proj2", title: "ประชุม Brand Direction", description: "กำหนดทิศทาง Brand ใหม่", type: "meeting", status: "todo", priority: "urgent", assigneeIds: ["user_ae1", "user_ae2"], responsibleId: "user_ae1", dueDate: fmt(addDays(today, 7)), dueTime: "14:00", endDate: fmt(addDays(today, 7)), endTime: "16:00", location: "ห้องประชุม A" },
    { id: "item6", projectId: "proj3", title: "สร้าง Content Calendar เดือนหน้า", description: "วางแผน Content สำหรับเดือนถัดไป", type: "task", status: "todo", priority: "medium", assigneeIds: ["user_ae3"], responsibleId: "user_ae3", dueDate: fmt(addDays(today, 10)) },
    { id: "item7", projectId: "proj1", title: "ส่งงาน Banner ให้ลูกค้า Approve", description: "ส่ง Banner ที่ออกแบบเสร็จให้ลูกค้าตรวจสอบ", type: "task", status: "todo", priority: "high", assigneeIds: ["user_ae1"], responsibleId: "user_ae1", dueDate: fmt(addDays(today, 4)), endDate: fmt(addDays(today, 6)) },
  ];
  for (const item of seedItems) await db.insert(items).values(item).onDuplicateKeyUpdate({ set: { title: item.title } });

  console.log("[Seed] Database seeded successfully");
}
