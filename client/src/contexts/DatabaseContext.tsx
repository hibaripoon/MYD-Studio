import { createContext, useContext, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type {
  Customer, Task, AppUser,
  WorkItem, InternalTask, CashCollection, TaskComment, ActivityLog, RevenueItem, FinancialDocument,
  MeetingNote, SystemSettings
} from "@/lib/database";

// ─── Re-export types for compatibility ───────────────────────────
export type { Customer, Task, AppUser };

interface DatabaseContextValue {
  customers: Customer[];
  tasks: Task[];
  appUsers: AppUser[];
  settings: SystemSettings;
  isLoading: boolean;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  customers: [],
  tasks: [],
  appUsers: [],
  settings: { companyName: "MYD Studio", mediaItems: [], productItems: [] },
  isLoading: false,
  refresh: () => {},
});

// ─── Helper: map raw DB row → Task (with nested arrays) ──────────
function mapTask(raw: any): Task {
  const cc = raw._cashCollection?.[0];
  const cashCollection: CashCollection = {
    id: cc?.id ?? "",
    taskId: raw.id,
    amount: cc ? parseFloat(cc.amount ?? "0") : 0,
    currency: cc?.currency ?? "THB",
    status: (cc?.status ?? "unpaid") as CashCollection["status"],
    invoiceNumber: cc?.invoiceNumber ?? undefined,
    invoiceDate: cc?.invoiceDate ?? undefined,
    dueDate: cc?.dueDate ?? undefined,
    paidDate: cc?.paidDate ?? undefined,
    collectedAmount: cc?.collectedAmount ? parseFloat(cc.collectedAmount) : undefined,
    note: cc?.note ?? undefined,
    documents: (raw._financialDocs ?? []).map((d: any): FinancialDocument => ({
      id: d.id,
      taskId: d.taskId,
      docType: d.docType,
      otherLabel: d.otherLabel ?? undefined,
      docDate: d.docDate ?? undefined,
      fileUrl: d.fileUrl ?? undefined,
      fileName: d.fileName ?? undefined,
      note: d.note ?? undefined,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt ?? ""),
      createdBy: d.createdBy ?? undefined,
    })),
  };

  return {
    id: raw.id,
    customerId: raw.customerId,
    title: raw.title,
    contactName: raw.contactName,
    contactPhone: raw.contactPhone ?? undefined,
    contactEmail: raw.contactEmail ?? undefined,
    aeId: raw.aeId ?? "",
    aeName: raw.aeName ?? "",
    status: raw.status,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString().slice(0, 10) : (raw.createdAt ?? ""),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString().slice(0, 10) : (raw.updatedAt ?? ""),
    brief: raw.brief ?? undefined,
    workItems: (raw._workItems ?? []).map((w: any): WorkItem => ({
      id: w.id,
      taskId: w.taskId,
      title: w.title,
      description: w.description ?? "",
      status: w.status,
      dueDate: w.dueDate ?? "",
      completedAt: w.completedAt ?? undefined,
      evidence: w.evidence ? (typeof w.evidence === "string" ? JSON.parse(w.evidence) : w.evidence) : [],
      evidenceNote: w.evidenceNote ?? undefined,
    })),
    internalTasks: (raw._internalTasks ?? []).map((it: any): InternalTask => ({
      id: it.id,
      taskId: it.taskId,
      title: it.title,
      done: Boolean(it.done),
      createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString().slice(0, 10) : (it.createdAt ?? ""),
      completedAt: it.completedAt ?? undefined,
    })),
    cashCollection,
    comments: (raw._comments ?? []).map((c: any): TaskComment => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : (c.createdAt ?? ""),
    })),
    activityLog: (raw._activityLogs ?? []).map((a: any): ActivityLog => ({
      id: a.id,
      taskId: a.taskId,
      type: a.type,
      description: a.description,
      authorName: a.authorName,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt ?? ""),
    })),
    revenueItems: (raw._revenueItems ?? []).map((r: any): RevenueItem => ({
      id: r.id,
      taskId: r.taskId,
      mediaName: r.mediaName,
      productType: r.productType,
      amount: parseFloat(r.amount ?? "0"),
    })),
    meetingNotes: (raw._meetingNotes ?? []).map((m: any): MeetingNote => ({
      id: m.id,
      taskId: m.taskId,
      authorId: m.authorId,
      authorName: m.authorName,
      content: m.content,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt ?? ""),
    })),
    taskType: (raw.taskType ?? "task") as "task" | "meeting",
    dueDate: raw.dueDate ?? undefined,
    dueTime: raw.dueTime ?? undefined,
    endDate: raw.endDate ?? undefined,
  };
}

function mapCustomer(raw: any): Customer {
  return {
    id: raw.id,
    brandName: raw.brandName,
    type: raw.type,
    contactName: raw.contactName ?? undefined,
    contactPhone: raw.contactPhone ?? undefined,
    contactEmail: raw.contactEmail ?? undefined,
    taxCompanyName: raw.taxCompanyName ?? undefined,
    taxAddress: raw.taxAddress ?? undefined,
    taxId: raw.taxId ?? undefined,
    avatarInitials: raw.avatarInitials ?? "",
    avatarColor: raw.avatarColor ?? "bg-slate-400",
    profilePhoto: raw.profilePhoto ?? undefined,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString().slice(0, 10) : (raw.createdAt ?? ""),
    name: raw.brandName,
    company: raw.brandName,
  };
}

function mapAppUser(raw: any): AppUser {
  return {
    id: raw.id,
    phone: raw.phone,
    password: raw.password ?? "",
    role: raw.role,
    companyRole: raw.companyRole ?? undefined,
    name: raw.name ?? "",
    avatarInitials: raw.avatarInitials ?? "",
    avatarColor: raw.avatarColor ?? "bg-slate-400",
    aeId: raw.aeId ?? undefined,
    email: raw.email ?? undefined,
    bankAccount: raw.bankAccount ?? undefined,
    bankName: raw.bankName ?? undefined,
    customerId: raw.customerId ?? undefined,
  };
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();

  const { data: rawCustomers = [], isLoading: loadingCustomers } = trpc.customers.list.useQuery();
  // Use listLight for context (list/dashboard views) — skips comments & activity logs
  // Detail views fetch tasks.byId directly which includes full payload
  const { data: rawTasks = [], isLoading: loadingTasks } = trpc.tasks.listLight.useQuery();
  const { data: rawAppUsers = [], isLoading: loadingUsers } = trpc.appUsers.list.useQuery();
  const { data: rawSettings, isLoading: loadingSettings } = trpc.settings.get.useQuery();

  // ─── useMemo: only re-map when raw data actually changes ─────────
  const customers = useMemo(() => rawCustomers.map(mapCustomer), [rawCustomers]);
  const tasks = useMemo(() => rawTasks.map(mapTask), [rawTasks]);
  const appUsers = useMemo(() => rawAppUsers.map(mapAppUser), [rawAppUsers]);
  const settings: SystemSettings = useMemo(() => rawSettings
    ? {
        companyName: rawSettings.companyName ?? "MYD Studio",
        mediaItems: rawSettings.mediaItems ?? [],
        productItems: rawSettings.productItems ?? [],
      }
    : { companyName: "MYD Studio", mediaItems: [], productItems: [] },
  [rawSettings]);

  const refresh = useCallback(() => {
    // Invalidate both the light list (used by context) and full list (used by any direct consumers)
    utils.tasks.listLight.invalidate();
    utils.tasks.list.invalidate();
  }, [utils]);

  return (
    <DatabaseContext.Provider value={{
      customers,
      tasks,
      appUsers,
      settings,
      isLoading: loadingCustomers || loadingTasks || loadingUsers || loadingSettings,
      refresh,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
