import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { nanoid } from "nanoid";

// ─── App Auth (phone/password) ────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  // Phone/password login for app users (AE + Customer)
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
  // Get app user by id
  getAppUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getAppUserById(input.id);
    }),
});

// ─── App Users (User Management) ─────────────────────────────

const appUsersRouter = router({
  list: publicProcedure.query(async () => {
    await db.seedIfEmpty();
    return db.getAppUsers();
  }),
  create: publicProcedure
    .input(z.object({
      phone: z.string(),
      password: z.string(),
      role: z.enum(["company", "customer"]),
      companyRole: z.enum(["admin", "sub_admin", "head", "ae"]).optional(),
      name: z.string(),
      avatarInitials: z.string(),
      avatarColor: z.string(),
      aeId: z.string().optional(),
      email: z.string().optional(),
      bankAccount: z.string().optional(),
      bankName: z.string().optional(),
      customerId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createAppUser({ id, ...input });
      return { id, ...input };
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
      bankAccount: z.string().optional().nullable(),
      bankName: z.string().optional().nullable(),
      profilePhoto: z.string().optional().nullable(),
      customerId: z.string().optional().nullable(),
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
});

// ─── Customers ────────────────────────────────────────────────

const customersRouter = router({
  list: publicProcedure.query(async () => {
    await db.seedIfEmpty();
    return db.getCustomers();
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => db.getCustomerById(input.id)),
  create: publicProcedure
    .input(z.object({
      brandName: z.string(),
      type: z.enum(["SME", "Agency", "Brand"]),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      taxCompanyName: z.string().optional(),
      taxAddress: z.string().optional(),
      taxId: z.string().optional(),
      avatarInitials: z.string(),
      avatarColor: z.string(),
      profilePhoto: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createCustomer({ id, ...input });
      return { id, ...input };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      brandName: z.string().optional(),
      type: z.enum(["SME", "Agency", "Brand"]).optional(),
      contactName: z.string().optional().nullable(),
      contactPhone: z.string().optional().nullable(),
      contactEmail: z.string().optional().nullable(),
      taxCompanyName: z.string().optional().nullable(),
      taxAddress: z.string().optional().nullable(),
      taxId: z.string().optional().nullable(),
      profilePhoto: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCustomer(id, data);
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteCustomer(input.id);
      return { success: true };
    }),
});

// ─── Tasks ────────────────────────────────────────────────────

const tasksRouter = router({
  list: publicProcedure.query(async () => {
    await db.seedIfEmpty();
    return db.getTasks();
  }),
  byCustomer: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => db.getTasksByCustomer(input.customerId)),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => db.getTaskById(input.id)),
  create: publicProcedure
    .input(z.object({
      customerId: z.string(),
      title: z.string(),
      contactName: z.string(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      aeId: z.string().optional(),
      aeName: z.string().optional(),
      brief: z.string().optional(),
      amount: z.number().optional(),
      idempotencyKey: z.string().optional(), // client-generated key to prevent duplicate creation
    }))
    .mutation(async ({ input }) => {
      // If idempotencyKey provided, check if a task with this key was already created recently (within 10 seconds)
      if (input.idempotencyKey) {
        const existing = await db.getTaskByIdempotencyKey(input.idempotencyKey);
        if (existing) return existing;
      }
      const id = nanoid(8);
      await db.createTask({ id, ...input, status: "pending", idempotencyKey: input.idempotencyKey });
      // Create cash collection record
      await db.upsertCashCollection({
        id: nanoid(8),
        taskId: id,
        amount: String(input.amount || 0),
        currency: "THB",
        status: "unpaid",
      });
      await db.createActivityLog({ id: nanoid(8), taskId: id, type: "task_created", description: "สร้าง Task ใหม่", authorName: input.aeName || "ระบบ" });
      return { id, ...input };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      customerId: z.string().optional(),
      title: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional().nullable(),
      contactEmail: z.string().optional().nullable(),
      aeId: z.string().optional().nullable(),
      aeName: z.string().optional().nullable(),
      status: z.enum(["pending", "in_progress", "review", "done", "cancelled"]).optional(),
      brief: z.string().optional().nullable(),
      amount: z.number().optional(), // updates cashCollection.amount
    }))
    .mutation(async ({ input }) => {
      const { id, amount, ...data } = input;
      await db.updateTask(id, data);
      // If amount provided, update cashCollection amount too
      if (amount !== undefined) {
        const existing = await db.getCashCollectionByTask(id);
        if (existing) {
          await db.upsertCashCollection({ id: existing.id, taskId: id, amount: String(amount), currency: existing.currency, status: existing.status });
        }
      }
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),
});

// ─── Work Items ───────────────────────────────────────────────

const workItemsRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getWorkItemsByTask(input.taskId)),
  create: publicProcedure
    .input(z.object({
      taskId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createWorkItem({ id, ...input, status: "pending" });
      await db.updateTask(input.taskId, {});
      return { id, ...input };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      status: z.enum(["pending", "in_progress", "review", "done", "cancelled"]).optional(),
      dueDate: z.string().optional().nullable(),
      completedAt: z.string().optional().nullable(),
      evidence: z.array(z.string()).optional(),
      evidenceNote: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, taskId, ...data } = input;
      await db.updateWorkItem(id, data);
      await db.updateTask(taskId, {});
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string(), taskId: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteWorkItem(input.id);
      await db.updateTask(input.taskId, {});
      return { success: true };
    }),
});

// ─── Internal Tasks ───────────────────────────────────────────

const internalTasksRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getInternalTasksByTask(input.taskId)),
  create: publicProcedure
    .input(z.object({ taskId: z.string(), title: z.string() }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createInternalTask({ id, ...input, done: false });
      return { id, ...input };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      taskId: z.string(),
      title: z.string().optional(),
      done: z.boolean().optional(),
      completedAt: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, taskId, ...data } = input;
      await db.updateInternalTask(id, data);
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteInternalTask(input.id);
      return { success: true };
    }),
});

// ─── Cash Collections ─────────────────────────────────────────

const cashCollectionRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getCashCollectionByTask(input.taskId)),
  upsert: publicProcedure
    .input(z.object({
      id: z.string(),
      taskId: z.string(),
      amount: z.string(),
      currency: z.string().default("THB"),
      status: z.enum(["unpaid", "invoiced", "paid"]),
      invoiceNumber: z.string().optional().nullable(),
      invoiceDate: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      paidDate: z.string().optional().nullable(),
      collectedAmount: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertCashCollection(input);
      return { success: true };
    }),
});

// ─── Financial Documents ──────────────────────────────────────

const financialDocsRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getFinancialDocsByTask(input.taskId)),
  create: publicProcedure
    .input(z.object({
      taskId: z.string(),
      docType: z.enum(["QT", "BL", "INV", "PO", "other"]),
      otherLabel: z.string().optional(),
      docDate: z.string().optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
      note: z.string().optional(),
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createFinancialDocument({ id, ...input });
      return { id, ...input };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteFinancialDocument(input.id);
      return { success: true };
    }),
});

// ─── Revenue Items ────────────────────────────────────────────

const revenueItemsRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getRevenueItemsByTask(input.taskId)),
  all: publicProcedure.query(async () => {
    await db.seedIfEmpty();
    return db.getAllRevenueItems();
  }),
  create: publicProcedure
    .input(z.object({
      taskId: z.string(),
      mediaName: z.string(),
      productType: z.string(),
      amount: z.string(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createRevenueItem({ id, ...input });
      return { id, ...input };
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      mediaName: z.string().optional(),
      productType: z.string().optional(),
      amount: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateRevenueItem(id, data);
      return { success: true };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteRevenueItem(input.id);
      return { success: true };
    }),
});

// ─── Task Comments ────────────────────────────────────────────

const commentsRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getCommentsByTask(input.taskId)),
  create: publicProcedure
    .input(z.object({
      taskId: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createComment({ id, ...input });
      return { id, ...input };
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteComment(input.id);
      return { success: true };
    }),
});

// ─── Activity Logs ────────────────────────────────────────────

const activityLogsRouter = router({
  byTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => db.getActivityLogsByTask(input.taskId)),
  create: publicProcedure
    .input(z.object({
      taskId: z.string(),
      type: z.string(),
      description: z.string(),
      authorName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const id = nanoid(8);
      await db.createActivityLog({ id, ...input });
      return { success: true };
    }),
});

// ─── System Settings ──────────────────────────────────────────

const settingsRouter = router({
  get: publicProcedure.query(async () => db.getSettings()),
  set: publicProcedure
    .input(z.object({
      companyName: z.string().optional(),
      mediaItems: z.array(z.string()).optional(),
      productItems: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.companyName !== undefined) await db.setSetting("companyName", input.companyName);
      if (input.mediaItems !== undefined) await db.setSetting("mediaItems", input.mediaItems);
      if (input.productItems !== undefined) await db.setSetting("productItems", input.productItems);
      return { success: true };
    }),
});

// ─── File Upload ────────────────────────────────────────────

const filesRouter = router({
  getUploadUrl: publicProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
      folder: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Return a pre-signed URL for frontend to upload directly
      // We'll use a unique key to avoid collisions
      const ext = input.fileName.split('.').pop() || 'bin';
      const key = `${input.folder || 'evidence'}/${nanoid(12)}.${ext}`;
      // Return the key so frontend knows where to upload
      return { key, uploadPath: key };
    }),
  upload: publicProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
      fileData: z.string(), // base64 encoded
      folder: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const ext = input.fileName.split('.').pop() || 'bin';
      const key = `${input.folder || 'evidence'}/${nanoid(12)}.${ext}`;
      const buffer = Buffer.from(input.fileData, 'base64');
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key, fileName: input.fileName };
    }),
});

// ─── App Router ───────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  appUsers: appUsersRouter,
  customers: customersRouter,
  tasks: tasksRouter,
  workItems: workItemsRouter,
  internalTasks: internalTasksRouter,
  cashCollection: cashCollectionRouter,
  financialDocs: financialDocsRouter,
  revenueItems: revenueItemsRouter,
  comments: commentsRouter,
  activityLogs: activityLogsRouter,
  settings: settingsRouter,
  files: filesRouter,
});

export type AppRouter = typeof appRouter;
