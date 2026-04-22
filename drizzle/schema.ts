import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── App Users (AE / Customer phone-based login) ─────────────
export const appUsers = mysqlTable("app_users", {
  id: varchar("id", { length: 32 }).primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["company", "customer"]).notNull(),
  companyRole: mysqlEnum("companyRole", ["admin", "sub_admin", "head", "ae"]),
  name: varchar("name", { length: 128 }).notNull(),
  avatarInitials: varchar("avatarInitials", { length: 8 }).notNull(),
  avatarColor: varchar("avatarColor", { length: 32 }).notNull(),
  aeId: varchar("aeId", { length: 32 }),
  email: varchar("email", { length: 320 }),
  profilePhoto: text("profilePhoto"),
  bankAccount: varchar("bankAccount", { length: 64 }),
  bankName: varchar("bankName", { length: 64 }),
  customerId: varchar("customerId", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

// ─── Customers ────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 32 }).primaryKey(),
  brandName: varchar("brandName", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["SME", "Agency", "Brand"]).notNull(),
  contactName: varchar("contactName", { length: 128 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  taxCompanyName: varchar("taxCompanyName", { length: 256 }),
  taxAddress: text("taxAddress"),
  taxId: varchar("taxId", { length: 32 }),
  avatarInitials: varchar("avatarInitials", { length: 8 }).notNull(),
  avatarColor: varchar("avatarColor", { length: 32 }).notNull(),
  profilePhoto: text("profilePhoto"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Tasks ────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 32 }).primaryKey(),
  customerId: varchar("customerId", { length: 32 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  contactName: varchar("contactName", { length: 128 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  aeId: varchar("aeId", { length: 32 }),
  aeName: varchar("aeName", { length: 128 }),
  status: mysqlEnum("status", ["pending", "in_progress", "review", "done", "cancelled"]).default("pending").notNull(),
  taskType: mysqlEnum("taskType", ["task", "meeting"]).default("task").notNull(), // task or meeting
  dueDate: varchar("dueDate", { length: 16 }),   // YYYY-MM-DD
  dueTime: varchar("dueTime", { length: 8 }),    // HH:mm (optional)
  endDate: varchar("endDate", { length: 16 }),   // YYYY-MM-DD (optional end date for range)
  brief: text("brief"),
  briefFiles: json("briefFiles").$type<{name: string; url: string}[]>(), // attached files for brief
  idempotencyKey: varchar("idempotencyKey", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerIdIdx: index("tasks_customer_id_idx").on(table.customerId),
  aeIdIdx: index("tasks_ae_id_idx").on(table.aeId),
  statusIdx: index("tasks_status_idx").on(table.status),
}));
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Work Items ───────────────────────────────────────────────
export const workItems = mysqlTable("work_items", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "review", "done", "cancelled"]).default("pending").notNull(),
  dueDate: varchar("dueDate", { length: 16 }),
  completedAt: varchar("completedAt", { length: 32 }),
  evidence: json("evidence").$type<string[]>().default([]),
  evidenceNote: text("evidenceNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdIdx: index("work_items_task_id_idx").on(table.taskId),
}));
export type WorkItem = typeof workItems.$inferSelect;
export type InsertWorkItem = typeof workItems.$inferInsert;

// ─── Internal Tasks ───────────────────────────────────────────
export const internalTasks = mysqlTable("internal_tasks", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  done: boolean("done").default(false).notNull(),
  completedAt: varchar("completedAt", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdIdx: index("internal_tasks_task_id_idx").on(table.taskId),
}));
export type InternalTask = typeof internalTasks.$inferSelect;
export type InsertInternalTask = typeof internalTasks.$inferInsert;

// ─── Cash Collections ─────────────────────────────────────────
export const cashCollections = mysqlTable("cash_collections", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 8 }).default("THB").notNull(),
  status: mysqlEnum("status", ["unpaid", "invoiced", "paid"]).default("unpaid").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 64 }),
  invoiceDate: varchar("invoiceDate", { length: 16 }),
  dueDate: varchar("dueDate", { length: 16 }),
  paidDate: varchar("paidDate", { length: 16 }),
  collectedAmount: decimal("collectedAmount", { precision: 15, scale: 2 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Note: cashCollections.taskId already has a UNIQUE constraint which acts as an index
export type CashCollection = typeof cashCollections.$inferSelect;
export type InsertCashCollection = typeof cashCollections.$inferInsert;

// ─── Financial Documents ──────────────────────────────────────
export const financialDocuments = mysqlTable("financial_documents", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  docType: mysqlEnum("docType", ["QT", "BL", "INV", "PO", "other"]).notNull(),
  otherLabel: varchar("otherLabel", { length: 128 }),
  docDate: varchar("docDate", { length: 16 }),
  fileUrl: text("fileUrl"),
  fileName: varchar("fileName", { length: 256 }),
  note: text("note"),
  createdBy: varchar("createdBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("financial_documents_task_id_idx").on(table.taskId),
}));
export type FinancialDocument = typeof financialDocuments.$inferSelect;
export type InsertFinancialDocument = typeof financialDocuments.$inferInsert;

// ─── Revenue Items (Revenue Breakdown) ───────────────────────
export const revenueItems = mysqlTable("revenue_items", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  mediaName: varchar("mediaName", { length: 128 }).notNull(),
  productType: varchar("productType", { length: 128 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdIdx: index("revenue_items_task_id_idx").on(table.taskId),
}));
export type RevenueItem = typeof revenueItems.$inferSelect;
export type InsertRevenueItem = typeof revenueItems.$inferInsert;

// ─── Task Comments ────────────────────────────────────────────
export const taskComments = mysqlTable("task_comments", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  authorId: varchar("authorId", { length: 32 }).notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("task_comments_task_id_idx").on(table.taskId),
}));
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

// ─── Activity Logs ────────────────────────────────────────────
export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  description: text("description").notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("activity_logs_task_id_idx").on(table.taskId),
}));
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─── Meeting Notes ──────────────────────────────────────────
export const meetingNotes = mysqlTable("meeting_notes", {
  id: varchar("id", { length: 32 }).primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  authorId: varchar("authorId", { length: 32 }).notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("meeting_notes_task_id_idx").on(table.taskId),
}));
export type MeetingNote = typeof meetingNotes.$inferSelect;
export type InsertMeetingNote = typeof meetingNotes.$inferInsert;

// ─── System Settings ──────────────────────────────────────────
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: json("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
