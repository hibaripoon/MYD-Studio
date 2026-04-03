// ============================================================
// MEDIA CRM — Shared In-Memory Database
// Single source of truth for all AE and Customer views
// ============================================================

import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────

export type CustomerType = "SME" | "Agency" | "Brand";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  company: string;
  avatarInitials: string;
  avatarColor: string;
  createdAt: string;
}

export type TaskStatus = "pending" | "in_progress" | "review" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "invoiced" | "partial" | "paid";

export interface WorkItem {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string;
  evidence?: string[]; // URLs or file names
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
  note?: string;
}

export interface Task {
  id: string;
  customerId: string;
  title: string;
  contactName: string;
  aeId: string;
  aeName: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  brief?: string;
  workItems: WorkItem[];
  internalTasks: InternalTask[];
  cashCollection: CashCollection;
}

export interface AEUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
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
    name: "คุณสมชาย ใจดี",
    type: "SME",
    contactName: "คุณสมชาย ใจดี",
    contactEmail: "somchai@thaifood.co.th",
    contactPhone: "081-234-5678",
    company: "ร้านอาหารไทยใจดี",
    avatarInitials: "สช",
    avatarColor: "bg-emerald-500",
    createdAt: "2024-01-15",
  },
  {
    id: "cust2",
    name: "คุณนิดา พงษ์ไพร",
    type: "Brand",
    contactName: "คุณนิดา พงษ์ไพร",
    contactEmail: "nida@beautybrand.com",
    contactPhone: "089-876-5432",
    company: "Beauty Brand Thailand",
    avatarInitials: "นพ",
    avatarColor: "bg-pink-500",
    createdAt: "2024-02-20",
  },
  {
    id: "cust3",
    name: "คุณวิชัย ตั้งมั่น",
    type: "Agency",
    contactName: "คุณวิชัย ตั้งมั่น",
    contactEmail: "wichai@adagency.co.th",
    contactPhone: "02-555-1234",
    company: "Creative Ad Agency",
    avatarInitials: "วต",
    avatarColor: "bg-violet-500",
    createdAt: "2024-03-10",
  },
  {
    id: "cust4",
    name: "คุณพรทิพย์ ศรีสวัสดิ์",
    type: "Brand",
    contactName: "คุณพรทิพย์ ศรีสวัสดิ์",
    contactEmail: "porntip@techbrand.com",
    contactPhone: "090-111-2222",
    company: "TechBrand Co., Ltd.",
    avatarInitials: "พศ",
    avatarColor: "bg-blue-500",
    createdAt: "2024-04-05",
  },
  {
    id: "cust5",
    name: "คุณอนุชา มีสุข",
    type: "SME",
    contactName: "คุณอนุชา มีสุข",
    contactEmail: "anucha@localshop.com",
    contactPhone: "083-444-5555",
    company: "Local Shop Online",
    avatarInitials: "อม",
    avatarColor: "bg-orange-500",
    createdAt: "2024-05-01",
  },
];

export const tasks: Task[] = [
  {
    id: "task1",
    customerId: "cust1",
    title: "แคมเปญ Social Media Q2/2025",
    contactName: "คุณสมชาย ใจดี",
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
      status: "partial",
      invoiceNumber: "INV-2025-001",
      invoiceDate: "2025-04-01",
      dueDate: "2025-04-30",
      note: "รับมัดจำ 50% แล้ว ยังค้างอีก 17,500 บาท",
    },
  },
  {
    id: "task2",
    customerId: "cust2",
    title: "Launch Campaign ผลิตภัณฑ์ใหม่ Beauty Brand",
    contactName: "คุณนิดา พงษ์ไพร",
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
    },
  },
  {
    id: "task3",
    customerId: "cust3",
    title: "Manage Social Media รายเดือน - Creative Agency",
    contactName: "คุณวิชัย ตั้งมั่น",
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
    },
  },
  {
    id: "task4",
    customerId: "cust4",
    title: "Google Ads Campaign - TechBrand",
    contactName: "คุณพรทิพย์ ศรีสวัสดิ์",
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
        dueDate: "2025-04-18",
      },
    ],
    internalTasks: [
      { id: "it7", taskId: "task4", title: "ขอ Access Google Ads Account จากลูกค้า", done: false, createdAt: "2025-04-10" },
      { id: "it8", taskId: "task4", title: "ศึกษา Competitor Keywords", done: false, createdAt: "2025-04-10" },
    ],
    cashCollection: {
      id: "cc4",
      taskId: "task4",
      amount: 45000,
      currency: "THB",
      status: "unpaid",
      dueDate: "2025-04-20",
      note: "รอส่ง Invoice",
    },
  },
  {
    id: "task5",
    customerId: "cust5",
    title: "สร้าง Line OA และ Content",
    contactName: "คุณอนุชา มีสุข",
    aeId: "ae2",
    aeName: "นภา วงศ์ดี",
    status: "done",
    createdAt: "2025-02-01",
    updatedAt: "2025-03-15",
    brief: "สร้าง Line Official Account พร้อม Rich Menu และ Auto-reply สำหรับร้านค้าออนไลน์",
    workItems: [
      {
        id: "w11",
        taskId: "task5",
        title: "Setup Line OA",
        description: "สร้างและตั้งค่า Line Official Account",
        status: "done",
        dueDate: "2025-02-15",
        completedAt: "2025-02-14",
        evidence: ["line_oa_setup.png"],
        evidenceNote: "Line OA พร้อมใช้งานแล้ว",
      },
      {
        id: "w12",
        taskId: "task5",
        title: "ออกแบบ Rich Menu",
        description: "Rich Menu 6 ช่อง พร้อม Link",
        status: "done",
        dueDate: "2025-02-20",
        completedAt: "2025-02-19",
        evidence: ["rich_menu_design.png"],
        evidenceNote: "Rich Menu Active แล้ว",
      },
    ],
    internalTasks: [
      { id: "it9", taskId: "task5", title: "ส่งมอบ Account ให้ลูกค้า", done: true, createdAt: "2025-03-10", completedAt: "2025-03-15" },
    ],
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
    },
  },
  {
    id: "task6",
    customerId: "cust1",
    title: "ถ่ายภาพ Product สำหรับเมนูใหม่",
    contactName: "คุณสมชาย ใจดี",
    aeId: "ae1",
    aeName: "ปิยะ สมบูรณ์",
    status: "cancelled",
    createdAt: "2025-03-01",
    updatedAt: "2025-03-20",
    brief: "ถ่ายภาพอาหารชุดใหม่ 20 เมนู สำหรับ Menu Update",
    workItems: [],
    internalTasks: [],
    cashCollection: {
      id: "cc6",
      taskId: "task6",
      amount: 15000,
      currency: "THB",
      status: "unpaid",
      note: "ยกเลิกงาน ไม่มีการเรียกเก็บเงิน",
    },
  },
];

// ─── Helper Functions ─────────────────────────────────────────

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getTasksByCustomer(customerId: string): Task[] {
  return tasks.filter((t) => t.customerId === customerId);
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function formatCurrency(amount: number, currency = "THB"): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
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
    partial: "ชำระบางส่วน",
    paid: "ชำระครบแล้ว",
  };
  return map[status];
}

export function getTaskProgress(task: Task): number {
  const workItems = task.workItems;
  if (workItems.length === 0) return 0;
  const done = workItems.filter((w) => w.status === "done").length;
  return Math.round((done / workItems.length) * 100);
}

export function getCustomerTypeLabel(type: CustomerType): string {
  return type; // SME, Agency, Brand
}

export function getCustomerTypeColor(type: CustomerType): string {
  const map: Record<CustomerType, string> = {
    SME: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Agency: "bg-violet-100 text-violet-700 border-violet-200",
    Brand: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return map[type];
}

// ─── Mutable Store (for create/update operations) ─────────────

class DatabaseStore {
  private _customers: Customer[] = [...customers];
  private _tasks: Task[] = [...tasks];
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

  getCustomers(): Customer[] {
    return this._customers;
  }

  getTasks(): Task[] {
    return this._tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this._tasks.find((t) => t.id === id);
  }

  getCustomerById(id: string): Customer | undefined {
    return this._customers.find((c) => c.id === id);
  }

  getTasksByCustomer(customerId: string): Task[] {
    return this._tasks.filter((t) => t.customerId === customerId);
  }

  createTask(data: {
    customerId: string;
    title: string;
    contactName: string;
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
      },
    };
    newTask.cashCollection.taskId = newTask.id;
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

  updatePaymentStatus(taskId: string, status: PaymentStatus, data?: Partial<CashCollection>) {
    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.cashCollection.status = status;
    if (data) {
      Object.assign(task.cashCollection, data);
    }
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

  createCustomer(data: Omit<Customer, "id" | "createdAt" | "avatarInitials">): Customer {
    const initials = data.name.slice(0, 2);
    const colors = ["bg-emerald-500", "bg-pink-500", "bg-violet-500", "bg-blue-500", "bg-orange-500", "bg-teal-500"];
    const customer: Customer = {
      id: nanoid(8),
      ...data,
      avatarInitials: initials,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString().split("T")[0],
    };
    this._customers.push(customer);
    this.notify();
    return customer;
  }
}

export const db = new DatabaseStore();
