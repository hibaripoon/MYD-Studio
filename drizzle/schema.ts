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
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

// ─── App Users (internal staff / phone-based login) ──────────
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

// ─── Projects ─────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 32 }).default("bg-blue-500").notNull(),
  ownerId: varchar("ownerId", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Items (Tasks & Meetings) ─────────────────────────────────
export const items = mysqlTable("items", {
  id: varchar("id", { length: 32 }).primaryKey(),
  projectId: varchar("projectId", { length: 32 }),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["task", "meeting"]).default("task").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  /** Comma-separated appUser IDs assigned to this item */
  assigneeIds: json("assigneeIds").$type<string[]>().default([]),
  /** Single appUser ID responsible for this item */
  responsibleId: varchar("responsibleId", { length: 32 }),
  dueDate: varchar("dueDate", { length: 16 }),   // YYYY-MM-DD
  dueTime: varchar("dueTime", { length: 8 }),    // HH:mm (optional)
  endDate: varchar("endDate", { length: 16 }),   // YYYY-MM-DD (optional end date for range)
  endTime: varchar("endTime", { length: 8 }),    // HH:mm (optional end time for meetings)
  location: varchar("location", { length: 256 }), // for meetings
  createdBy: varchar("createdBy", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("items_project_id_idx").on(table.projectId),
  typeIdx: index("items_type_idx").on(table.type),
  statusIdx: index("items_status_idx").on(table.status),
  responsibleIdx: index("items_responsible_id_idx").on(table.responsibleId),
}));
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

// ─── Item Comments ────────────────────────────────────────────
export const itemComments = mysqlTable("item_comments", {
  id: varchar("id", { length: 32 }).primaryKey(),
  itemId: varchar("itemId", { length: 32 }).notNull(),
  authorId: varchar("authorId", { length: 32 }).notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  itemIdIdx: index("item_comments_item_id_idx").on(table.itemId),
}));
export type ItemComment = typeof itemComments.$inferSelect;
export type InsertItemComment = typeof itemComments.$inferInsert;

// ─── Meeting Notes ────────────────────────────────────────────
export const meetingNotes = mysqlTable("meeting_notes", {
  id: varchar("id", { length: 32 }).primaryKey(),
  itemId: varchar("itemId", { length: 32 }).notNull(),
  authorId: varchar("authorId", { length: 32 }).notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  itemIdIdx: index("meeting_notes_item_id_idx").on(table.itemId),
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
