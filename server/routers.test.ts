/**
 * Unit tests for media-crm tRPC routers
 * Tests cover: settings, appUsers, projects, items, itemComments, meetingNotes procedures
 */
import { describe, expect, it, vi } from "vitest";
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
    companyLogo: "",
    primaryColor: "#3b82f6",
    mediaItems: ["Facebook", "Instagram"],
    productItems: ["Sponsored Post", "Story"],
  }),
  setSetting: vi.fn().mockResolvedValue(undefined),
  getAppUsers: vi.fn().mockResolvedValue([
    {
      id: "ae1",
      phone: "0812345001",
      name: "Alice AE",
      role: "company",
      companyRole: "ae",
      avatarInitials: "AA",
      avatarColor: "bg-blue-500",
      email: null,
      profilePhoto: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAppUserById: vi.fn().mockResolvedValue(null),
  getAppUserByPhone: vi.fn().mockResolvedValue(null),
  createAppUser: vi.fn().mockResolvedValue(undefined),
  updateAppUser: vi.fn().mockResolvedValue(undefined),
  deleteAppUser: vi.fn().mockResolvedValue(undefined),
  getProjects: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue(null),
  createProject: vi.fn().mockResolvedValue(undefined),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  getItems: vi.fn().mockResolvedValue([]),
  getItemsByType: vi.fn().mockResolvedValue([]),
  getItemById: vi.fn().mockResolvedValue(null),
  createItem: vi.fn().mockResolvedValue(undefined),
  updateItem: vi.fn().mockResolvedValue(undefined),
  deleteItem: vi.fn().mockResolvedValue(undefined),
  getCommentsByItem: vi.fn().mockResolvedValue([]),
  createItemComment: vi.fn().mockImplementation(async (data: Record<string, unknown>) => data),
  deleteItemComment: vi.fn().mockResolvedValue(undefined),
  getMeetingNotesByItem: vi.fn().mockResolvedValue([]),
  createMeetingNote: vi.fn().mockImplementation(async (data: Record<string, unknown>) => data),
  deleteMeetingNote: vi.fn().mockResolvedValue(undefined),
  appLogin: vi.fn().mockResolvedValue(null),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Settings ─────────────────────────────────────────────────
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
    const result = await caller.settings.set({ key: "companyName", value: "NewCo" });
    expect(result).toEqual({ success: true });
  });
});

// ─── AppUsers ─────────────────────────────────────────────────
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
    });
    expect(result.id).toBeTruthy();
    expect(result.id).toMatch(/^user_/);
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

// ─── Projects ─────────────────────────────────────────────────
describe("projects router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new project with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      color: "bg-blue-500",
    });
    expect(result.id).toBeTruthy();
    expect(result.id).toMatch(/^proj_/);
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.update({ id: "proj1", name: "Updated Project" });
    expect(result).toEqual({ success: true });
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.projects.delete({ id: "proj1" });
    expect(result).toEqual({ success: true });
  });
});

// ─── Items ────────────────────────────────────────────────────
describe("items router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.items.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("create task returns new item with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.items.create({
      title: "Test Task",
      type: "task",
      status: "todo",
      priority: "medium",
    });
    expect(result.id).toBeTruthy();
    expect(result.id).toMatch(/^item_/);
  });

  it("create meeting returns new item with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.items.create({
      title: "Team Standup",
      type: "meeting",
      status: "todo",
      priority: "medium",
      dueDate: "2026-05-01",
      dueTime: "10:00",
    });
    expect(result.id).toBeTruthy();
    expect(result.id).toMatch(/^item_/);
  });

  it("update returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.items.update({ id: "item1", status: "in_progress" });
    expect(result).toEqual({ success: true });
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.items.delete({ id: "item1" });
    expect(result).toEqual({ success: true });
  });
});

// ─── Item Comments ────────────────────────────────────────────
describe("itemComments router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.itemComments.list({ itemId: "item1" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new comment with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.itemComments.create({
      itemId: "item1",
      authorId: "ae1",
      authorName: "Alice AE",
      content: "This is a test comment",
    });
    expect(result).toBeTruthy();
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.itemComments.delete({ id: "comment1" });
    expect(result).toEqual({ success: true });
  });
});

// ─── Meeting Notes ────────────────────────────────────────────
describe("meetingNotes router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.meetingNotes.list({ itemId: "item1" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new meeting note with id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.meetingNotes.create({
      itemId: "item1",
      authorId: "ae1",
      authorName: "Alice AE",
      content: "Meeting summary notes",
    });
    expect(result).toBeTruthy();
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.meetingNotes.delete({ id: "note1" });
    expect(result).toEqual({ success: true });
  });
});
