// ============================================================
// MEDIA CRM — Shared In-Memory Database
// Single source of truth for all AE and Customer views
// ============================================================

import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────

export type CustomerType = "SME" | "Agency" | "Brand";

export interface Customer {
  id: string;
  // Required
  brandName: string;       // ชื่อแบรนด์ / Agency
  type: CustomerType;
  // Optional contact
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Optional tax info
  taxCompanyName?: string;
  taxAddress?: string;
  taxId?: string;
  // System
  avatarInitials: string;
  avatarColor: string;
  profilePhoto?: string;   // base64 or URL
  createdAt: string;
  // Legacy compat
  name: string;            // = brandName (alias)
  company: string;         // = brandName (alias)
}

export type TaskStatus = "pending" | "in_progress" | "review" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "invoiced" | "paid";
export type FinancialDocType = "QT" | "BL" | "INV" | "PO" | "other";

export interface FinancialDocument {
  id: string;
  taskId: string;
  docType: FinancialDocType;
  otherLabel?: string;   // required when docType === "other"
  docDate?: string;      // ISO date string (optional)
  fileUrl?: string;      // attached file URL or link
  fileName?: string;     // display name for the file
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface WorkItem {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string;
  evidence?: string[];
  evidenceNote?: string;
}

export interface InternalTask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface CashCollection {
  id: string;
  taskId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paidDate?: string;
  collectedAmount?: number; // ยอดที่เก็บได้จริง
  note?: string;
  // New: financial documents list
  documents: FinancialDocument[];
}

export type ActivityLogType = "status_change" | "work_item_added" | "work_item_done" | "work_item_deleted" | "internal_task_added" | "document_added" | "payment_updated" | "comment_added" | "task_created";

// ─── Revenue Breakdown ────────────────────────────────────────

export type RevenueCategory = "media" | "product";

export interface RevenueItem {
  id: string;
  taskId: string;
  mediaName: string;    // ชื่อ Media / เพจ
  productType: string;  // ประเภท Product / Service
  amount: number;
}

// ─── System Settings ──────────────────────────────────────────

export interface SystemSettings {
  companyName: string;
  mediaItems: string[];   // ชื่อ Media ที่ใช้ใน Revenue Breakdown
  productItems: string[]; // ชื่อ Product ที่ใช้ใน Revenue Breakdown
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyName: "MYD Studio",
  mediaItems: ["Facebook Page", "Instagram", "TikTok", "YouTube", "Line OA", "Google Ads"],
  productItems: ["ถ่ายภาพ", "ตัดต่อวิดีโอ", "Graphic Design", "Content Writing", "KOL/Influencer", "Live Streaming"],
};

export interface ActivityLog {
  id: string;
  taskId: string;
  type: ActivityLogType;
  description: string;
  authorName: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  customerId: string;
  title: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  aeId: string;
  aeName: string;
  status: TaskStatus;
  taskType?: "task" | "meeting";
  dueDate?: string;
  dueTime?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  brief?: string;
  briefFiles?: { name: string; url: string }[];
  workItems: WorkItem[];
  internalTasks: InternalTask[];
  cashCollection: CashCollection;
  comments: TaskComment[];
  meetingNotes: MeetingNote[];
  activityLog: ActivityLog[];
  revenueItems: RevenueItem[]; // Revenue Breakdown
}

export type UserRole = "company" | "customer";
export type CompanyRole = "admin" | "sub_admin" | "head" | "ae";

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  admin: "Admin",
  sub_admin: "Sub Admin",
  head: "Head",
  ae: "AE",
};

export const COMPANY_ROLE_COLORS: Record<CompanyRole, string> = {
  admin: "bg-red-100 text-red-700",
  sub_admin: "bg-orange-100 text-orange-700",
  head: "bg-purple-100 text-purple-700",
  ae: "bg-blue-100 text-blue-700",
};

// Roles that can see ALL tasks (not just their own)
export const CAN_SEE_ALL_TASKS: CompanyRole[] = ["admin", "sub_admin", "head"];

export interface AppUser {
  id: string;
  phone: string;       // login credential
  password: string;    // plain text for demo
  role: UserRole;
  companyRole?: CompanyRole; // only for role === "company"
  name: string;
  avatarInitials: string;
  avatarColor: string;
  // For company users
  aeId?: string;
  email?: string;
  profilePhoto?: string;  // base64 or URL
  bankAccount?: string;   // เลขบัญชีธนาคาร
  bankName?: string;      // ชื่อธนาคาร
  // For Customer — links to Customer record
  customerId?: string;
}

export interface AEUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
}

// ─── Auth Session (localStorage-backed, 7-day expiry) ─────────

const SESSION_KEY = "mediaflow_session";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface AuthSession {
  userId: string;
  role: UserRole;
  companyRole?: CompanyRole;
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

export function saveSession(userId: string, role: UserRole, companyRole?: CompanyRole, customerId?: string) {
  const session: AuthSession & { customerId?: string } = {
    userId,
    role,
    companyRole,
    expiresAt: Date.now() + SESSION_TTL,
    ...(customerId ? { customerId } : {}),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Seed Data ────────────────────────────────────────────────

export const aeUsers: AEUser[] = [
  { id: "ae1", name: "ปิยะ สมบูรณ์", email: "piya@mediacompany.co.th", avatarInitials: "ปส" },
  { id: "ae2", name: "นภา วงศ์ดี", email: "napa@mediacompany.co.th", avatarInitials: "นว" },
  { id: "ae3", name: "ธนา รักษ์ไทย", email: "tana@mediacompany.co.th", avatarInitials: "ธร" },
];

export const customers: Customer[] = [
  {
    id: "cust1",
    brandName: "ร้านอาหารไทยใจดี",
    name: "ร้านอาหารไทยใจดี",
    company: "ร้านอาหารไทยใจดี",
    type: "SME",
    contactName: "คุณสมชาย ใจดี",
    contactEmail: "somchai@thaifood.co.th",
    contactPhone: "0812345678",
    taxCompanyName: "ร้านอาหารไทยใจดี",
    taxAddress: "123 ถ.สุขุมวิท กรุงเทพฯ 10110",
    taxId: "0105555012345",
    avatarInitials: "รท",
    avatarColor: "bg-emerald-500",
    createdAt: "2024-01-15",
  },
  {
    id: "cust2",
    brandName: "Beauty Brand Thailand",
    name: "Beauty Brand Thailand",
    company: "Beauty Brand Thailand",
    type: "Brand",
    contactName: "คุณนิดา พงษ์ไพร",
    contactEmail: "nida@beautybrand.com",
    contactPhone: "0898765432",
    avatarInitials: "บท",
    avatarColor: "bg-pink-500",
    createdAt: "2024-02-20",
  },
  {
    id: "cust3",
    brandName: "Creative Ad Agency",
    name: "Creative Ad Agency",
    company: "Creative Ad Agency",
    type: "Agency",
    contactName: "คุณวิชัย ตั้งมั่น",
    contactEmail: "wichai@adagency.co.th",
    contactPhone: "025551234",
    avatarInitials: "ซอ",
    avatarColor: "bg-violet-500",
    createdAt: "2024-03-10",
  },
  {
    id: "cust4",
    brandName: "TechBrand Co., Ltd.",
    name: "TechBrand Co., Ltd.",
    company: "TechBrand Co., Ltd.",
    type: "Brand",
    contactName: "คุณพรทิพย์ ศรีสวัสดิ์",
    contactEmail: "porntip@techbrand.com",
    contactPhone: "0901112222",
    taxCompanyName: "เทคแบรนด์ จำกัด",
    taxAddress: "456 ถ.พระราม 9 กรุงเทพฯ 10310",
    taxId: "0105566023456",
    avatarInitials: "ทบ",
    avatarColor: "bg-blue-500",
    createdAt: "2024-04-05",
  },
  {
    id: "cust5",
    brandName: "Local Shop Online",
    name: "Local Shop Online",
    company: "Local Shop Online",
    type: "SME",
    contactName: "คุณอนุชา มีสุข",
    contactEmail: "anucha@localshop.com",
    contactPhone: "0834445555",
    avatarInitials: "ลช",
    avatarColor: "bg-orange-500",
    createdAt: "2024-05-01",
  },
];

// App Users (phone-based login)
export const appUsers: AppUser[] = [
  // Company Users
  {
    id: "user_ae1",
    phone: "0812345001",
    password: "ae1234",
    role: "company",
    companyRole: "admin",
    name: "ปิยะ สมบูรณ์",
    avatarInitials: "ปส",
    avatarColor: "bg-blue-500",
    aeId: "ae1",
    email: "piya@mediacompany.co.th",
  },
  {
    id: "user_ae2",
    phone: "0812345002",
    password: "ae1234",
    role: "company",
    companyRole: "head",
    name: "นภา วงศ์ดี",
    avatarInitials: "นว",
    avatarColor: "bg-purple-500",
    aeId: "ae2",
    email: "napa@mediacompany.co.th",
  },
  {
    id: "user_ae3",
    phone: "0812345003",
    password: "ae1234",
    role: "company",
    companyRole: "ae",
    name: "ธนา รักษ์ไทย",
    avatarInitials: "ธร",
    avatarColor: "bg-teal-500",
    aeId: "ae3",
    email: "tana@mediacompany.co.th",
  },
  // Customer Users
  {
    id: "user_cust1",
    phone: "0812345678",
    password: "cust1234",
    role: "customer",
    name: "คุณสมชาย ใจดี",
    avatarInitials: "สช",
    avatarColor: "bg-emerald-500",
    customerId: "cust1",
  },
  {
    id: "user_cust2",
    phone: "0898765432",
    password: "cust1234",
    role: "customer",
    name: "คุณนิดา พงษ์ไพร",
    avatarInitials: "นพ",
    avatarColor: "bg-pink-500",
    customerId: "cust2",
  },
  {
    id: "user_cust3",
    phone: "0255512345",
    password: "cust1234",
    role: "customer",
    name: "คุณวิชัย ตั้งมั่น",
    avatarInitials: "วต",
    avatarColor: "bg-violet-500",
    customerId: "cust3",
  },
  {
    id: "user_cust4",
    phone: "0901112222",
    password: "cust1234",
    role: "customer",
    name: "คุณพรทิพย์ ศรีสวัสดิ์",
    avatarInitials: "พศ",
    avatarColor: "bg-blue-500",
    customerId: "cust4",
  },
  {
    id: "user_cust5",
    phone: "0834445555",
    password: "cust1234",
    role: "customer",
    name: "คุณอนุชา มีสุข",
    avatarInitials: "อม",
    avatarColor: "bg-orange-500",
    customerId: "cust5",
  },
];

export const tasks: Task[] = [
  {
    id: "task1",
    customerId: "cust1",
    title: "แคมเปญ Social Media Q2/2025",
    contactName: "คุณสมชาย ใจดี",
    contactPhone: "0812345678",
    contactEmail: "somchai@thaifood.co.th",
    aeId: "ae1",
    aeName: "ปิยะ สมบูรณ์",
    status: "in_progress",
    createdAt: "2025-04-01",
    updatedAt: "2025-04-10",
    brief: "ต้องการโปรโมทร้านอาหารผ่าน Facebook และ Instagram เน้นเมนูใหม่ช่วงซัมเมอร์ ลูกค้าต้องการยอด Reach อย่างน้อย 50,000 ต่อโพสต์",
    workItems: [
      {
        id: "w1",
        taskId: "task1",
        title: "ลง Post Facebook 4 ชิ้น",
        description: "โพสต์เมนูใหม่ทุกสัปดาห์ พร้อม caption และ hashtag",
        status: "done",
        dueDate: "2025-04-07",
        completedAt: "2025-04-06",
        evidence: ["post_fb_week1.jpg", "post_fb_week2.jpg"],
        evidenceNote: "โพสต์ครบ 4 ชิ้นแล้ว ยอด Reach เฉลี่ย 62,000",
      },
      {
        id: "w2",
        taskId: "task1",
        title: "ยิง Ads Facebook Boost",
        description: "Budget 5,000 บาท เป้าหมาย Reach 100,000",
        status: "in_progress",
        dueDate: "2025-04-30",
      },
      {
        id: "w3",
        taskId: "task1",
        title: "ลง Instagram Reels 2 ชิ้น",
        description: "วิดีโอสั้น 30 วินาที แสดงการทำอาหาร",
        status: "pending",
        dueDate: "2025-04-25",
      },
    ],
    internalTasks: [
      { id: "it1", taskId: "task1", title: "ตามบรีฟเพิ่มเติมจากลูกค้า", done: true, createdAt: "2025-04-01", completedAt: "2025-04-02" },
      { id: "it2", taskId: "task1", title: "ไปถ่ายภาพอาหารที่ร้าน", done: true, createdAt: "2025-04-01", completedAt: "2025-04-04" },
      { id: "it3", taskId: "task1", title: "ส่ง Content Plan ให้ลูกค้า Approve", done: false, createdAt: "2025-04-05" },
    ],
    cashCollection: {
      id: "cc1",
      taskId: "task1",
      amount: 35000,
      currency: "THB",
      status: "invoiced",
      invoiceNumber: "INV-2025-001",
      invoiceDate: "2025-04-01",
      dueDate: "2025-04-30",
      note: "ส่ง Invoice แล้ว รอชำระ",

      documents: [
        { id: "doc1", taskId: "task1", docType: "QT", docDate: "2025-03-28", fileName: "QT-2025-001.pdf", fileUrl: "#", note: "ใบเสนอราคาเริ่มต้น", createdAt: "2025-03-28" },
        { id: "doc2", taskId: "task1", docType: "INV", docDate: "2025-04-01", fileName: "INV-2025-001.pdf", fileUrl: "#", note: "Invoice งวดแรก 50%", createdAt: "2025-04-01" },
      ],
    },
    comments: [
      {
        id: "cmt1",
        taskId: "task1",
        authorId: "user_ae1",
        authorName: "ปิยะ สมบูรณ์",
        content: "ลูกค้าโทรมาบอกว่าต้องการเพิ่ม Hashtag ที่เกี่ยวกับซัมเมอร์ด้วย",
        createdAt: "2025-04-08T10:30:00",
      },
    ],
    meetingNotes: [],
    revenueItems: [
      { id: "ri1", taskId: "task1", mediaName: "Facebook Page", productType: "ถ่ายภาพ", amount: 15000 },
      { id: "ri2", taskId: "task1", mediaName: "Instagram", productType: "Graphic Design", amount: 20000 },
    ],
    activityLog: [{ id: "al1", taskId: "task1", type: "task_created", description: "สร้าง Task ใหม่", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-01" }, { id: "al2", taskId: "task1", type: "status_change", description: "เปลี่ยนสถานะเป็น กำลังดำเนินการ", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-05" }],
  },
  {
    id: "task2",
    customerId: "cust2",
    title: "Launch Campaign ผลิตภัณฑ์ใหม่ Beauty Brand",
    contactName: "คุณนิดา พงษ์ไพร",
    contactPhone: "0898765432",
    contactEmail: "nida@beautybrand.com",
    aeId: "ae2",
    aeName: "นภา วงศ์ดี",
    status: "review",
    createdAt: "2025-03-15",
    updatedAt: "2025-04-08",
    brief: "Launch ผลิตภัณฑ์ Serum ใหม่ ต้องการ KOL review, ลง TikTok และ YouTube พร้อม Landing Page",
    workItems: [
      {
        id: "w4",
        taskId: "task2",
        title: "จัด KOL Review 3 คน",
        description: "ติดต่อ KOL ระดับ Micro-Influencer 3 คน",
        status: "done",
        dueDate: "2025-03-31",
        completedAt: "2025-03-28",
        evidence: ["kol1_review.mp4", "kol2_review.mp4", "kol3_review.mp4"],
        evidenceNote: "KOL ทั้ง 3 คนโพสต์แล้ว ยอดวิวรวม 180,000",
      },
      {
        id: "w5",
        taskId: "task2",
        title: "ทำ TikTok Video 5 ชิ้น",
        description: "วิดีโอ How-to use Serum",
        status: "review",
        dueDate: "2025-04-15",
      },
      {
        id: "w6",
        taskId: "task2",
        title: "Gen Landing Page Code",
        description: "หน้า Landing Page สำหรับ Product Launch",
        status: "done",
        dueDate: "2025-04-10",
        completedAt: "2025-04-09",
        evidence: ["landing_page_screenshot.png"],
        evidenceNote: "Landing Page live แล้วที่ beautybrand.com/serum-new",
      },
    ],
    internalTasks: [
      { id: "it4", taskId: "task2", title: "ประสานงาน KOL ส่งสินค้า", done: true, createdAt: "2025-03-15", completedAt: "2025-03-20" },
      { id: "it5", taskId: "task2", title: "Review TikTok ก่อนโพสต์", done: false, createdAt: "2025-04-01" },
    ],
    cashCollection: {
      id: "cc2",
      taskId: "task2",
      amount: 120000,
      currency: "THB",
      status: "invoiced",
      invoiceNumber: "INV-2025-002",
      invoiceDate: "2025-03-15",
      dueDate: "2025-04-15",
      note: "ส่ง Invoice แล้ว รอลูกค้าโอน",
      documents: [
        { id: "doc3", taskId: "task2", docType: "QT", docDate: "2025-03-10", fileName: "QT-2025-002.pdf", fileUrl: "#", createdAt: "2025-03-10" },
        { id: "doc4", taskId: "task2", docType: "PO", docDate: "2025-03-14", fileName: "PO-Beauty-001.pdf", fileUrl: "#", note: "PO จากลูกค้า", createdAt: "2025-03-14" },
        { id: "doc5", taskId: "task2", docType: "INV", docDate: "2025-03-15", fileName: "INV-2025-002.pdf", fileUrl: "#", createdAt: "2025-03-15" },
      ],
    },
    comments: [],
    meetingNotes: [],
    revenueItems: [
      { id: "ri3", taskId: "task2", mediaName: "TikTok", productType: "KOL/Influencer", amount: 60000 },
      { id: "ri4", taskId: "task2", mediaName: "YouTube", productType: "ตัดต่อวิดีโอ", amount: 60000 },
    ],
    activityLog: [{ id: "al3", taskId: "task2", type: "task_created", description: "สร้าง Task ใหม่", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-10" }, { id: "al4", taskId: "task2", type: "document_added", description: "เพิ่มเอกสาร ใบเสนอราคา (QT)", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-10" }],
  },
  {
    id: "task3",
    customerId: "cust3",
    title: "Manage Social Media รายเดือน - Creative Agency",
    contactName: "คุณวิชัย ตั้งมั่น",
    contactPhone: "025551234",
    contactEmail: "wichai@adagency.co.th",
    aeId: "ae1",
    aeName: "ปิยะ สมบูรณ์",
    status: "in_progress",
    createdAt: "2025-01-01",
    updatedAt: "2025-04-10",
    brief: "ดูแล Social Media ทุก Platform รายเดือน ประกอบด้วย Facebook, Instagram, LinkedIn",
    workItems: [
      {
        id: "w7",
        taskId: "task3",
        title: "โพสต์ Facebook เดือน เม.ย.",
        description: "12 โพสต์ต่อเดือน",
        status: "in_progress",
        dueDate: "2025-04-30",
      },
      {
        id: "w8",
        taskId: "task3",
        title: "Monthly Report เดือน มี.ค.",
        description: "รายงานผล Engagement ประจำเดือน",
        status: "done",
        dueDate: "2025-04-05",
        completedAt: "2025-04-04",
        evidence: ["march_report.pdf"],
        evidenceNote: "ส่ง Report ให้ลูกค้าแล้ว",
      },
    ],
    internalTasks: [
      { id: "it6", taskId: "task3", title: "วางแผน Content เดือนหน้า", done: false, createdAt: "2025-04-10" },
    ],
    cashCollection: {
      id: "cc3",
      taskId: "task3",
      amount: 25000,
      currency: "THB",
      status: "paid",
      invoiceNumber: "INV-2025-003",
      invoiceDate: "2025-04-01",
      dueDate: "2025-04-10",
      paidDate: "2025-04-08",
      note: "ชำระแล้วเต็มจำนวน",
      documents: [
        { id: "doc6", taskId: "task3", docType: "INV", docDate: "2025-04-01", fileName: "INV-2025-003.pdf", fileUrl: "#", createdAt: "2025-04-01" },
        { id: "doc7", taskId: "task3", docType: "BL", docDate: "2025-04-08", fileName: "BL-2025-003.pdf", fileUrl: "#", note: "ใบเสร็จรับเงิน", createdAt: "2025-04-08" },
      ],
    },
    comments: [],
    meetingNotes: [],
    revenueItems: [
      { id: "ri5", taskId: "task3", mediaName: "Facebook Page", productType: "Content Writing", amount: 15000 },
      { id: "ri6", taskId: "task3", mediaName: "Instagram", productType: "Graphic Design", amount: 10000 },
    ],
    activityLog: [{ id: "al5", taskId: "task3", type: "task_created", description: "สร้าง Task ใหม่", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-01-01" }, { id: "al6", taskId: "task3", type: "payment_updated", description: "อัปเดตสถานะการชำระเงิน: ชำระครบแล้ว", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-04-08" }],
  },
  {
    id: "task4",
    customerId: "cust4",
    title: "Google Ads Campaign - TechBrand",
    contactName: "คุณพรทิพย์ ศรีสวัสดิ์",
    contactPhone: "0901112222",
    contactEmail: "porntip@techbrand.com",
    aeId: "ae3",
    aeName: "ธนา รักษ์ไทย",
    status: "pending",
    createdAt: "2025-04-10",
    updatedAt: "2025-04-10",
    brief: "ยิง Google Search Ads และ Display Ads เพื่อเพิ่ม Traffic ไปยังเว็บไซต์",
    workItems: [
      {
        id: "w9",
        taskId: "task4",
        title: "Setup Google Ads Account",
        description: "ตั้งค่า Campaign, Ad Groups, Keywords",
        status: "pending",
        dueDate: "2025-04-20",
      },
      {
        id: "w10",
        taskId: "task4",
        title: "ออกแบบ Banner Ads",
        description: "Banner ขนาดต่างๆ สำหรับ Display Network",
        status: "pending",
        dueDate: "2025-04-22",
      },
    ],
    internalTasks: [
      { id: "it7", taskId: "task4", title: "ขอ Access Google Ads Account จากลูกค้า", done: false, createdAt: "2025-04-10" },
    ],
    cashCollection: {
      id: "cc4",
      taskId: "task4",
      amount: 45000,
      currency: "THB",
      status: "unpaid",
      dueDate: "2025-04-20",
      note: "รอส่ง Invoice",
      documents: [],
    },
    comments: [],
    meetingNotes: [],
    revenueItems: [
      { id: "ri7", taskId: "task4", mediaName: "Google Ads", productType: "Graphic Design", amount: 45000 },
    ],
    activityLog: [{ id: "al7", taskId: "task4", type: "task_created", description: "สร้าง Task ใหม่", authorName: "ธนา รักษ์ไทย", createdAt: "2025-04-10" }],
  },
  {
    id: "task5",
    customerId: "cust5",
    title: "สร้าง Line OA และ Content",
    contactName: "คุณอนุชา มีสุข",
    contactPhone: "0834445555",
    contactEmail: "anucha@localshop.com",
    aeId: "ae2",
    aeName: "นภา วงศ์ดี",
    status: "done",
    createdAt: "2025-01-15",
    updatedAt: "2025-02-28",
    brief: "สร้าง Line Official Account และทำ Content สำหรับโปรโมทสินค้าในร้าน",
    workItems: [
      {
        id: "w11",
        taskId: "task5",
        title: "Setup Line OA",
        description: "สร้างและตั้งค่า Line Official Account",
        status: "done",
        dueDate: "2025-01-31",
        completedAt: "2025-01-28",
        evidence: ["lineoa_setup.png"],
        evidenceNote: "Line OA พร้อมใช้งานแล้ว",
      },
      {
        id: "w12",
        taskId: "task5",
        title: "ทำ Content 10 ชิ้น",
        description: "Content สำหรับโปรโมทสินค้า",
        status: "done",
        dueDate: "2025-02-28",
        completedAt: "2025-02-25",
        evidence: ["content_pack.zip"],
        evidenceNote: "ส่ง Content ครบ 10 ชิ้นแล้ว",
      },
    ],
    internalTasks: [],
    cashCollection: {
      id: "cc5",
      taskId: "task5",
      amount: 18000,
      currency: "THB",
      status: "paid",
      invoiceNumber: "INV-2025-004",
      invoiceDate: "2025-02-01",
      dueDate: "2025-02-28",
      paidDate: "2025-02-25",
      note: "ชำระครบแล้ว",
      documents: [
        { id: "doc8", taskId: "task5", docType: "INV", docDate: "2025-02-01", fileName: "INV-2025-004.pdf", fileUrl: "#", createdAt: "2025-02-01" },
        { id: "doc9", taskId: "task5", docType: "BL", docDate: "2025-02-25", fileName: "BL-2025-004.pdf", fileUrl: "#", createdAt: "2025-02-25" },
      ],
    },
    comments: [],
    meetingNotes: [],
    revenueItems: [
      { id: "ri8", taskId: "task5", mediaName: "Line OA", productType: "Content Writing", amount: 18000 },
    ],
    activityLog: [{ id: "al8", taskId: "task5", type: "task_created", description: "สร้าง Task ใหม่", authorName: "นภา วงศ์ดี", createdAt: "2025-01-15" }, { id: "al9", taskId: "task5", type: "status_change", description: "เปลี่ยนสถานะเป็น เสร็จสิ้น", authorName: "นภา วงศ์ดี", createdAt: "2025-02-28" }],
  },
  {
    id: "task6",
    customerId: "cust1",
    title: "ถ่ายภาพ Product สำหรับเมนูใหม่",
    contactName: "คุณสมชาย ใจดี",
    contactPhone: "0812345678",
    contactEmail: "somchai@thaifood.co.th",
    aeId: "ae1",
    aeName: "ปิยะ สมบูรณ์",
    status: "cancelled",
    createdAt: "2025-03-01",
    updatedAt: "2025-03-10",
    brief: "ถ่ายภาพเมนูอาหารใหม่สำหรับใช้ใน Social Media",
    workItems: [],
    internalTasks: [],
    cashCollection: {
      id: "cc6",
      taskId: "task6",
      amount: 15000,
      currency: "THB",
      status: "unpaid",
      documents: [],
    },
    comments: [],
    meetingNotes: [],
    revenueItems: [],
    activityLog: [{ id: "al10", taskId: "task6", type: "task_created", description: "สร้าง Task ใหม่", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-01" }, { id: "al11", taskId: "task6", type: "status_change", description: "เปลี่ยนสถานะเป็น ยกเลิก", authorName: "ปิยะ สมบูรณ์", createdAt: "2025-03-10" }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

export function getTaskProgress(task: Task): number {
  if (task.workItems.length === 0) return 0;
  const done = task.workItems.filter((w) => w.status === "done").length;
  return Math.round((done / task.workItems.length) * 100);
}

export function getStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending: "รอดำเนินการ",
    in_progress: "กำลังดำเนินการ",
    review: "รอ Review",
    done: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };
  return map[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    unpaid: "ยังไม่เก็บเงิน",
    invoiced: "ส่ง Invoice แล้ว",
    paid: "ชำระครบแล้ว",
  };
  return map[status];
}

export function getCustomerTypeLabel(type: CustomerType): string {
  const map: Record<CustomerType, string> = {
    SME: "SME",
    Agency: "Agency",
    Brand: "Brand",
  };
  return map[type];
}

export function getCustomerTypeColor(type: CustomerType): string {
  const map: Record<CustomerType, string> = {
    SME: "bg-emerald-100 text-emerald-700",
    Agency: "bg-violet-100 text-violet-700",
    Brand: "bg-blue-100 text-blue-700",
  };
  return map[type];
}

// ─── Mutable Store ────────────────────────────────────────────

class DatabaseStore {
  private _customers: Customer[] = [...customers];
  private _tasks: Task[] = [...tasks];
  private _users: AppUser[] = [...appUsers];
  private _listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this._listeners.forEach((l) => l());
  }

  // ── Auth ──────────────────────────────────────────────────

  login(phone: string, password: string): AppUser | null {
    const normalized = phone.replace(/[-\s]/g, "");
    const user = this._users.find(
      (u) => u.phone.replace(/[-\s]/g, "") === normalized && u.password === password
    );
    return user || null;
  }

  getUserById(id: string): AppUser | undefined {
    return this._users.find((u) => u.id === id);
  }

  getUsers(): AppUser[] {
    return this._users;
  }

  createUser(data: Omit<AppUser, "id">): AppUser {
    const user: AppUser = { id: nanoid(8), ...data };
    this._users.push(user);
    this.notify();
    return user;
  }

  updateUser(id: string, data: Partial<Omit<AppUser, "id">>) {
    const user = this._users.find((u) => u.id === id);
    if (!user) return;
    Object.assign(user, data);
    this.notify();
  }

  deleteUser(id: string) {
    this._users = this._users.filter((u) => u.id !== id);
    this.notify();
  }

  // ── Customers ─────────────────────────────────────────────

  getCustomers(): Customer[] {
    return this._customers;
  }

  getCustomerById(id: string): Customer | undefined {
    return this._customers.find((c) => c.id === id);
  }

  createCustomer(data: {
    brandName: string;
    type: CustomerType;
    profilePhoto?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    taxCompanyName?: string;
    taxAddress?: string;
    taxId?: string;
  }): Customer {
    const colors = ["bg-emerald-500", "bg-pink-500", "bg-violet-500", "bg-blue-500", "bg-orange-500", "bg-teal-500", "bg-rose-500", "bg-amber-500"];
    const initials = data.brandName.slice(0, 2);
    const customer: Customer = {
      id: nanoid(8),
      brandName: data.brandName,
      name: data.brandName,
      company: data.brandName,
      type: data.type,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      taxCompanyName: data.taxCompanyName,
      taxAddress: data.taxAddress,
      taxId: data.taxId,
      profilePhoto: data.profilePhoto,
      avatarInitials: initials,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString().split("T")[0],
    };
    this._customers.push(customer);
    this.notify();
    return customer;
  }

  updateCustomer(id: string, data: Partial<Omit<Customer, "id" | "createdAt" | "avatarInitials" | "avatarColor">>) {
    const customer = this._customers.find((c) => c.id === id);
    if (!customer) return;
    Object.assign(customer, data);
    // Keep aliases in sync
    if (data.brandName) {
      customer.name = data.brandName;
      customer.company = data.brandName;
    }
    this.notify();
  }

  deleteCustomer(id: string): boolean {
    const hasWork = this._tasks.some((t) => t.customerId === id && t.status !== "cancelled");
    if (hasWork) return false;
    this._customers = this._customers.filter((c) => c.id !== id);
    // Also delete linked user
    this._users = this._users.filter((u) => u.customerId !== id);
    this.notify();
    return true;
  }

  // ── Tasks ─────────────────────────────────────────────────

  getTasks(): Task[] {
    return this._tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this._tasks.find((t) => t.id === id);
  }

  getTasksByCustomer(customerId: string): Task[] {
    return this._tasks.filter((t) => t.customerId === customerId);
  }

  createTask(data: {
    customerId: string;
    title: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    aeId: string;
    aeName: string;
    amount: number;
    brief?: string;
  }): Task {
    const newTask: Task = {
      id: nanoid(8),
      customerId: data.customerId,
      title: data.title,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      aeId: data.aeId,
      aeName: data.aeName,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      brief: data.brief,
      workItems: [],
      internalTasks: [],
      cashCollection: {
        id: nanoid(8),
        taskId: "",
        amount: data.amount,
        currency: "THB",
        status: "unpaid",
        documents: [],
      },
      comments: [],
      activityLog: [{ id: Math.random().toString(36).slice(2), taskId: "", type: "task_created" as ActivityLogType, description: "สร้าง Task ใหม่", authorName: data.aeName, createdAt: new Date().toISOString().split("T")[0] }],
      meetingNotes: [],
      revenueItems: [],
    };
    newTask.cashCollection.taskId = newTask.id;
    newTask.activityLog[0].taskId = newTask.id;
    this._tasks.unshift(newTask);
    this.notify();
    return newTask;
  }

  addWorkItem(taskId: string, data: { title: string; description: string; dueDate: string }): WorkItem {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const item: WorkItem = {
      id: nanoid(8),
      taskId,
      title: data.title,
      description: data.description,
      status: "pending",
      dueDate: data.dueDate,
    };
    task.workItems.push(item);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
    return item;
  }

  completeWorkItem(taskId: string, workItemId: string, evidence: string[], evidenceNote: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.workItems.find((w) => w.id === workItemId);
    if (!item) return;
    item.status = "done";
    item.completedAt = new Date().toISOString().split("T")[0];
    item.evidence = evidence;
    item.evidenceNote = evidenceNote;
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.updateTaskStatus(taskId);
    this.notify();
  }

  addInternalTask(taskId: string, title: string): InternalTask {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const item: InternalTask = {
      id: nanoid(8),
      taskId,
      title,
      done: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    task.internalTasks.push(item);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
    return item;
  }

  toggleInternalTask(taskId: string, internalTaskId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.internalTasks.find((i) => i.id === internalTaskId);
    if (!item) return;
    item.done = !item.done;
    item.completedAt = item.done ? new Date().toISOString().split("T")[0] : undefined;
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  deleteInternalTask(taskId: string, internalTaskId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.internalTasks = task.internalTasks.filter((i) => i.id !== internalTaskId);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  editInternalTask(taskId: string, internalTaskId: string, title: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.internalTasks.find((i) => i.id === internalTaskId);
    if (!item) return;
    item.title = title;
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  updatePaymentStatus(taskId: string, status: PaymentStatus, data?: Partial<CashCollection>) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.cashCollection.status = status;
    if (data) Object.assign(task.cashCollection, data);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  updateTaskStatus(taskId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const workItems = task.workItems;
    if (workItems.length === 0) return;
    const allDone = workItems.every((w) => w.status === "done");
    const anyInProgress = workItems.some((w) => w.status === "in_progress");
    const anyReview = workItems.some((w) => w.status === "review");
    if (allDone) task.status = "done";
    else if (anyReview) task.status = "review";
    else if (anyInProgress) task.status = "in_progress";
    this.notify();
  }

  // Manual override task status (for confirm-complete and revert-to-TODO)
  setTaskStatus(taskId: string, status: TaskStatus) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = status;
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  updateWorkItemStatus(taskId: string, workItemId: string, status: TaskStatus) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.workItems.find((w) => w.id === workItemId);
    if (!item) return;
    item.status = status;
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.updateTaskStatus(taskId);
    this.notify();
  }

  addComment(taskId: string, authorId: string, authorName: string, content: string): TaskComment {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const comment: TaskComment = {
      id: nanoid(8),
      taskId,
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    task.comments.push(comment);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
    return comment;
  }

  deleteComment(taskId: string, commentId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.comments = task.comments.filter((c) => c.id !== commentId);
    this.notify();
  }

  addFinancialDocument(taskId: string, data: {
    docType: FinancialDocType;
    otherLabel?: string;
    docDate?: string;
    fileUrl?: string;
    fileName?: string;
    note?: string;
    createdBy?: string;
  }): FinancialDocument {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const doc: FinancialDocument = {
      id: nanoid(8),
      taskId,
      docType: data.docType,
      otherLabel: data.otherLabel,
      docDate: data.docDate,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      note: data.note,
      createdBy: data.createdBy,
      createdAt: new Date().toISOString().split("T")[0],
    };
    task.cashCollection.documents.push(doc);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
    return doc;
  }


  editWorkItem(taskId: string, workItemId: string, data: { title?: string; description?: string; dueDate?: string }) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.workItems.find((w) => w.id === workItemId);
    if (!item) return;
    Object.assign(item, data);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.addActivityLogEntry(taskId, "work_item_added", `แก้ไข Work Item: ${item.title}`, "ระบบ");
    this.notify();
  }

  deleteWorkItem(taskId: string, workItemId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.workItems.find((w) => w.id === workItemId);
    const title = item?.title || "";
    task.workItems = task.workItems.filter((w) => w.id !== workItemId);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.updateTaskStatus(taskId);
    this.addActivityLogEntry(taskId, "work_item_deleted", `ลบ Work Item: ${title}`, "ระบบ");
    this.notify();
  }

  addActivityLogEntry(taskId: string, type: ActivityLogType, description: string, authorName: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.activityLog) task.activityLog = [];
    task.activityLog.push({
      id: Math.random().toString(36).slice(2),
      taskId,
      type,
      description,
      authorName,
      createdAt: new Date().toISOString(),
    });
  }

  deleteFinancialDocument(taskId: string, docId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.cashCollection.documents = task.cashCollection.documents.filter((d) => d.id !== docId);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  // ── Revenue Breakdown ────────────────────────────────────────

  addRevenueItem(taskId: string, data: { mediaName: string; productType: string; amount: number }): RevenueItem {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    const item: RevenueItem = { id: nanoid(8), taskId, ...data };
    task.revenueItems.push(item);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
    return item;
  }

  updateRevenueItem(taskId: string, itemId: string, data: Partial<Omit<RevenueItem, "id" | "taskId">>) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item = task.revenueItems.find((r) => r.id === itemId);
    if (!item) return;
    Object.assign(item, data);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  deleteRevenueItem(taskId: string, itemId: string) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.revenueItems = task.revenueItems.filter((r) => r.id !== itemId);
    task.updatedAt = new Date().toISOString().split("T")[0];
    this.notify();
  }

  // ── System Settings ───────────────────────────────────────────

  private _settings: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

  getSettings(): SystemSettings {
    return this._settings;
  }

  updateSettings(data: Partial<SystemSettings>) {
    Object.assign(this._settings, data);
    this.notify();
  }

  // Helper: derive overall payment status from documents
  getDocTypeLabel(docType: FinancialDocType, otherLabel?: string): string {
    const map: Record<FinancialDocType, string> = {
      QT: "ใบเสนอราคา (QT)",
      BL: "ใบวางบิล (BL)",
      INV: "ใบแจ้งหนี้ / Invoice (INV)",
      PO: "ใบสั่งซื้อ (PO)",
      other: otherLabel || "เอกสารอื่นๆ",
    };
    return map[docType];
  }
}

export const db = new DatabaseStore();
