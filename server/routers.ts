import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { nanoid } from "nanoid";

// ─── Auth ─────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  appLogin: publicProcedure
    .input(z.object({ phone: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const normalized = input.phone.replace(/[-\s]/g, "");
      const user = await db.getAppUserByPhone(normalized);
      if (!user || user.password !== input.password) {
        throw new Error("เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง");
      }
      return user;
    }),
  getAppUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getAppUserById(input.id);
    }),
});

// ─── App Users ────────────────────────────────────────────────
const appUsersRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAppUsers();
  }),
  create: publicProcedure
    .input(z.object({
      phone: z.string(),
      password: z.string(),
      role: z.enum(["company", "customer"]).default("company"),
      companyRole: z.enum(["admin", "sub_admin", "head", "ae"]).optional(),
      name: z.string(),
      avatarInitials: z.string().optional(),
      avatarColor: z.string().optional(),
      aeId: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = `user_${nanoid(8)}`;
      const aeId = input.aeId || `ae_${nanoid(6)}`;
      await db.createAppUser({
        id,
        aeId,
        ...input,
        avatarInitials: input.avatarInitials || input.name.slice(0, 2),
        avatarColor: input.avatarColor || "bg-blue-500",
      });
      return { id };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      phone: z.string().optional(),
      password: z.string().optional(),
      role: z.enum(["company", "customer"]).optional(),
      companyRole: z.enum(["admin", "sub_admin", "head", "ae"]).optional().nullable(),
      name: z.string().optional(),
      avatarInitials: z.string().optional(),
      avatarColor: z.string().optional(),
      aeId: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      profilePhoto: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAppUser(id, data);
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteAppUser(input.id);
      return { success: true };
    }),
  uploadPhoto: publicProcedure
    .input(z.object({ id: z.string(), base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `app-users/${input.id}/profile-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updateAppUser(input.id, { profilePhoto: url });
      return { url };
    }),
});

// ─── Projects ─────────────────────────────────────────────────
const projectsRouter = router({
  list: publicProcedure.query(async () => {
    return db.getProjects();
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getProjectById(input.id);
    }),
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().optional(),
      ownerId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = `proj_${nanoid(8)}`;
      await db.createProject({ id, ...input, color: input.color || "bg-blue-500" });
      return { id };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      ownerId: z.string().optional(),
      status: z.enum(["active", "archived", "completed"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProject(id, data);
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteProject(input.id);
      return { success: true };
    }),
});

// ─── Items (Tasks & Meetings) ─────────────────────────────────
const itemsRouter = router({
  list: publicProcedure
    .input(z.object({
      projectId: z.string().optional(),
      type: z.enum(["task", "meeting"]).optional(),
    }))
    .query(async ({ input }) => {
      if (input.type) return db.getItemsByType(input.type);
      return db.getItems(input.projectId);
    }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getItemById(input.id);
    }),
  create: publicProcedure
    .input(z.object({
      projectId: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["task", "meeting"]).default("task"),
      status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).default("todo"),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      assigneeIds: z.array(z.string()).optional(),
      responsibleId: z.string().optional(),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      endDate: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = `item_${nanoid(8)}`;
      const { assigneeIds, ...rest } = input;
      await db.createItem({
        id,
        ...rest,
        assigneeIds: assigneeIds ?? null,
      });
      return { id };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assigneeIds: z.array(z.string()).optional(),
      responsibleId: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      dueTime: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      endTime: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      projectId: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, assigneeIds, ...rest } = input;
      await db.updateItem(id, {
        ...rest,
        ...(assigneeIds !== undefined ? { assigneeIds } : {}),
      });
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteItem(input.id);
      return { success: true };
    }),
});

// ─── Item Comments ────────────────────────────────────────────
const itemCommentsRouter = router({
  list: publicProcedure
    .input(z.object({ itemId: z.string() }))
    .query(async ({ input }) => {
      return db.getCommentsByItem(input.itemId);
    }),
  create: publicProcedure
    .input(z.object({
      itemId: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const id = `cmt_${nanoid(8)}`;
      return db.createItemComment({ id, ...input });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteItemComment(input.id);
      return { success: true };
    }),
});

// ─── Meeting Notes ────────────────────────────────────────────
const meetingNotesRouter = router({
  list: publicProcedure
    .input(z.object({ itemId: z.string() }))
    .query(async ({ input }) => {
      return db.getMeetingNotesByItem(input.itemId);
    }),
  create: publicProcedure
    .input(z.object({
      itemId: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const id = `mn_${nanoid(8)}`;
      return db.createMeetingNote({ id, ...input });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteMeetingNote(input.id);
      return { success: true };
    }),
});

// ─── Settings ─────────────────────────────────────────────────
const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return db.getSettings();
  }),
  set: publicProcedure
    .input(z.object({ key: z.string(), value: z.unknown() }))
    .mutation(async ({ input }) => {
      await db.setSetting(input.key, input.value);
      return { success: true };
    }),
});

// ─── File Upload ──────────────────────────────────────────────
const uploadRouter = router({
  uploadFile: publicProcedure
    .input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      folder: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const ext = input.mimeType.split("/")[1] || "bin";
      const folder = input.folder || "uploads";
      const key = `${folder}/${nanoid(12)}.${ext}`;
      const buffer = Buffer.from(input.base64, "base64");
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url, key };
    }),
});

// ─── App Router ───────────────────────────────────────────────
export const appRouter = router({
  auth: authRouter,
  appUsers: appUsersRouter,
  projects: projectsRouter,
  items: itemsRouter,
  itemComments: itemCommentsRouter,
  meetingNotes: meetingNotesRouter,
  settings: settingsRouter,
  upload: uploadRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
