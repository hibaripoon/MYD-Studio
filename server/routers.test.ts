/**
 * Unit tests for media-crm tRPC routers
 * Tests cover: settings, appUsers, tasks, revenueItems procedures
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  seedIfEmpty: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue({
    companyName: "TestCo",
    mediaItems: ["Facebook", "Instagram"],
    productItems: ["Sponsored Post", "Story"],
  }),
  setSetting: vi.fn().mockResolvedValue(undefined),
  getAppUsers: vi.fn().mockResolvedValue([
    {
      id: "ae1",
      phone: "0812345001",
      name: "Alice AE",
      role: "admin",
      companyRole: "ae",
      avatarInitials: "AA",
      avatarColor: "bg-blue-500",
    },
  ]),
  getAppUserById: vi.fn().mockResolvedValue(null),
  getAppUserByPhone: vi.fn().mockResolvedValue(null),
  createAppUser: vi.fn().mockResolvedValue(undefined),
  updateAppUser: vi.fn().mockResolvedValue(undefined),
  deleteAppUser: vi.fn().mockResolvedValue(undefined),
  getCustomers: vi.fn().mockResolvedValue([]),
  getCustomerById: vi.fn().mockResolvedValue(null),
  createCustomer: vi.fn().mockResolvedValue(undefined),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  deleteCustomer: vi.fn().mockResolvedValue(undefined),
  getTasks: vi.fn().mockResolvedValue([]),
  getTasksByCustomer: vi.fn().mockResolvedValue([]),
  getTaskById: vi.fn().mockResolvedValue(null),
  createTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  getWorkItemsByTask: vi.fn().mockResolvedValue([]),
  createWorkItem: vi.fn().mockResolvedValue(undefined),
  updateWorkItem: vi.fn().mockResolvedValue(undefined),
  deleteWorkItem: vi.fn().mockResolvedValue(undefined),
  getInternalTasksByTask: vi.fn().mockResolvedValue([]),
  createInternalTask: vi.fn().mockResolvedValue(undefined),
  updateInternalTask: vi.fn().mockResolvedValue(undefined),
  deleteInternalTask: vi.fn().mockResolvedValue(undefined),
  getCashCollectionByTask: vi.fn().mockResolvedValue(null),
  upsertCashCollection: vi.fn().mockResolvedValue(undefined),
  getFinancialDocsByTask: vi.fn().mockResolvedValue([]),
  createFinancialDocument: vi.fn().mockResolvedValue(undefined),
  deleteFinancialDocument: vi.fn().mockResolvedValue(undefined),
  getRevenueItemsByTask: vi.fn().mockResolvedValue([]),
  getAllRevenueItems: vi.fn().mockResolvedValue([]),
  createRevenueItem: vi.fn().mockResolvedValue(undefined),
  updateRevenueItem: vi.fn().mockResolvedValue(undefined),
  deleteRevenueItem: vi.fn().mockResolvedValue(undefined),
  getCommentsByTask: vi.fn().mockResolvedValue([]),
  createComment: vi.fn().mockResolvedValue(undefined),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  getActivityLogsByTask: vi.fn().mockResolvedValue([]),
  createActivityLog: vi.fn().mockResolvedValue(undefined),
  appLogin: vi.fn().mockResolvedValue(null),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("settings router", () => {
  it("get returns settings with mediaItems and productItems", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.settings.get();
    expect(result).toMatchObject({
      companyName: "TestCo",
      mediaItems: expect.arrayContaining(["Facebook", "Instagram"]),
      productItems: expect.arrayContaining(["Sponsored Post", "Story"]),
    });
  });

  it("set returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.settings.set({
      companyName: "NewCo",
      mediaItems: ["YouTube"],
    });
    expect(result).toEqual({ success: true });
  });
});

describe("appUsers router", () => {
  it("list returns array of users", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({ name: "Alice AE", companyRole: "ae" });
  });

  it("create returns new user with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.create({
      phone: "0899999999",
      password: "pass1234",
      name: "Bob AE",
      role: "company",
      companyRole: "ae",
      avatarInitials: "BA",
      avatarColor: "bg-green-500",
    });
    expect(result).toMatchObject({ phone: "0899999999", name: "Bob AE" });
    expect(result.id).toBeTruthy();
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.update({ id: "ae1", name: "Alice Updated" });
    expect(result).toEqual({ success: true });
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.appUsers.delete({ id: "ae1" });
    expect(result).toEqual({ success: true });
  });
});

describe("tasks router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new task with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tasks.create({
      customerId: "cust1",
      title: "Test Task",
      contactName: "Contact Person",
      aeId: "ae1",
      aeName: "Alice AE",
      amount: 50000,
    });
    expect(result).toMatchObject({ title: "Test Task", customerId: "cust1" });
    expect(result.id).toBeTruthy();
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tasks.update({ id: "task1", status: "in_progress" });
    expect(result).toEqual({ success: true });
  });
});

describe("revenueItems router", () => {
  it("all returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.revenueItems.all();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new revenue item with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.revenueItems.create({
      taskId: "task1",
      mediaName: "Facebook",
      productType: "Sponsored Post",
      amount: "15000",
    });
    expect(result).toMatchObject({
      taskId: "task1",
      mediaName: "Facebook",
      productType: "Sponsored Post",
    });
    expect(result.id).toBeTruthy();
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.revenueItems.update({ id: "rev1", amount: "20000" });
    expect(result).toEqual({ success: true });
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.revenueItems.delete({ id: "rev1" });
    expect(result).toEqual({ success: true });
  });
});

describe("comments router", () => {
  it("create returns new comment with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.comments.create({
      taskId: "task1",
      authorId: "ae1",
      authorName: "Alice AE",
      content: "This is a test comment",
    });
    expect(result).toMatchObject({
      taskId: "task1",
      authorName: "Alice AE",
      content: "This is a test comment",
    });
    expect(result.id).toBeTruthy();
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.comments.delete({ id: "comment1" });
    expect(result).toEqual({ success: true });
  });
});
