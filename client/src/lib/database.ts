// Type Definitions for MYD Studio

export type CompanyRole = "admin" | "sub_admin" | "head" | "ae";

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  admin: "Admin",
  sub_admin: "Sub-Admin",
  head: "Head",
  ae: "AE",
};

export const COMPANY_ROLE_COLORS: Record<CompanyRole, string> = {
  admin: "bg-red-100 text-red-700",
  sub_admin: "bg-orange-100 text-orange-700",
  head: "bg-purple-100 text-purple-700",
  ae: "bg-blue-100 text-blue-700",
};

export interface AppUser {
  id: string;
  phone: string;
  password?: string;
  role: "company" | "customer";
  companyRole?: CompanyRole | null;
  name: string;
  avatarInitials?: string | null;
  avatarColor?: string | null;
  aeId?: string | null;
  email?: string | null;
  profilePhoto?: string | null;
  createdAt?: Date | string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: "active" | "archived" | "completed" | null;
  ownerId?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface Item {
  id: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  type: "task" | "meeting";
  status: "todo" | "in_progress" | "review" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeIds?: string[] | null;
  responsibleId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  location?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface ItemComment {
  id: string;
  itemId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt?: Date | string | null;
}

export interface MeetingNote {
  id: string;
  itemId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt?: Date | string | null;
}

export type ItemStatus = Item["status"];
export type ItemPriority = Item["priority"];

export function parseAssigneeIds(assigneeIds: string[] | null | undefined): string[] {
  if (!assigneeIds) return [];
  if (Array.isArray(assigneeIds)) return assigneeIds;
  try { return JSON.parse(assigneeIds as unknown as string); } catch { return []; }
}

export const STATUS_LABELS: Record<Item["status"], string> = {
  todo: "รอดำเนินการ",
  in_progress: "กำลังทำ",
  review: "รอตรวจสอบ",
  done: "เสร็จแล้ว",
  cancelled: "ยกเลิก",
};

export const PRIORITY_LABELS: Record<Item["priority"], string> = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
  urgent: "เร่งด่วน",
};

export const STATUS_COLORS: Record<Item["status"], string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const PRIORITY_COLORS: Record<Item["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-cyan-500",
];

const SESSION_KEY = "mydstudio_session";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface AuthSession {
  userId: string;
  role: "company" | "customer";
  companyRole?: "admin" | "head" | "ae";
  expiresAt: number;
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(userId: string, role: "company" | "customer", companyRole?: "admin" | "head" | "ae") {
  const session: AuthSession = {
    userId,
    role,
    companyRole,
    expiresAt: Date.now() + SESSION_TTL,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
