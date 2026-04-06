/**
 * Cash Collection Tab — Financial Document Manager
 * Design: Modern SaaS — Clean Slate with Warm Accents
 * Shows summary dashboard + list of tasks with their financial document counts
 * Clicking a task navigates to Task Detail page where documents can be managed
 */
import { useLocation } from "wouter";
import {
  FileText, AlertCircle, Clock, CheckCircle2, DollarSign,
  ChevronRight, Search, Filter, FilePlus, FolderOpen, Download, Archive, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { ArchiveSidePanel } from "@/components/shared/ArchiveSidePanel";
import { useDatabase } from "@/contexts/DatabaseContext";
import { PaymentStatus, formatCurrency, getSession } from "@/lib/database";
import { cn } from "@/lib/utils";

const DOC_TYPE_COLORS: Record<string, string> = {
  QT: "bg-amber-100 text-amber-700 border-amber-200",
  BL: "bg-blue-100 text-blue-700 border-blue-200",
  INV: "bg-green-100 text-green-700 border-green-200",
  PO: "bg-violet-100 text-violet-700 border-violet-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

const paymentFilters: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unpaid", label: "ยังไม่เก็บเงิน" },
  { value: "invoiced", label: "ส่ง Invoice แล้ว" },
  { value: "paid", label: "ชำระครบแล้ว" },
];

export default function CashCollectionTab({ initialArchiveOpen = false }: { initialArchiveOpen?: boolean }) {
  const [, navigate] = useLocation();
  const { tasks, customers, appUsers } = useDatabase();
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<PaymentStatus | "all">("all");
  const [showArchive, setShowArchive] = useState(initialArchiveOpen);

  // ─── Lookup maps: O(1) access instead of O(n) find() per render ───
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const userMap = useMemo(() => new Map(appUsers.map((u) => [u.id, u])), [appUsers]);

  // AE role filter — AE sees only own tasks; Admin/Head/Sub Admin see all
  const session = getSession();
  const currentUser = useMemo(() => userMap.get(session?.userId ?? "") ?? null, [userMap, session?.userId]);
  const isAE = currentUser?.companyRole === "ae";

  const allActive = tasks
    .filter((t) => t.status !== "cancelled")
    .filter((t) => {
      if (isAE && currentUser) return t.aeId === currentUser.id;
      return true;
    });

  const unpaidCount = allActive.filter((t) => t.cashCollection.status === "unpaid").length;
  const invoicedCount = allActive.filter((t) => t.cashCollection.status === "invoiced").length;
  const paidCount = allActive.filter((t) => t.cashCollection.status === "paid").length;

  // Always use cashCollection.amount as the authoritative figure for billing/collection
  const taskAmount = (t: typeof allActive[0]) => t.cashCollection.amount || 0;
  const totalUnpaid = allActive.filter((t) => t.cashCollection.status === "unpaid").reduce((s, t) => s + taskAmount(t), 0);
  const totalInvoiced = allActive.filter((t) => t.cashCollection.status === "invoiced").reduce((s, t) => s + taskAmount(t), 0);
  const totalPaid = allActive.filter((t) => t.cashCollection.status === "paid").reduce((s, t) => s + taskAmount(t), 0);
  const grandTotal = allActive.reduce((s, t) => s + taskAmount(t), 0);

  const totalDocs = allActive.reduce((s, t) => s + (t.cashCollection.documents?.length || 0), 0);

  const filtered = allActive.filter((t) => {
    const customer = customerMap.get(t.customerId);
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchPay = payFilter === "all" || t.cashCollection.status === payFilter;
    return matchSearch && matchPay;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Dashboard Summary — 4 cards same size as Customer CRM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={AlertCircle}
          label="ยังไม่เก็บเงิน"
          count={unpaidCount}
          amount={totalUnpaid}
          accentClass="border-l-red-500"
          iconClass="bg-red-50 text-red-500"
          valueClass="text-red-600"
        />
        <StatCard
          icon={FileText}
          label="ส่ง Invoice แล้ว"
          count={invoicedCount}
          amount={totalInvoiced}
          accentClass="border-l-blue-500"
          iconClass="bg-blue-50 text-blue-500"
          valueClass="text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="ชำระครบแล้ว"
          count={paidCount}
          amount={totalPaid}
          accentClass="border-l-green-500"
          iconClass="bg-green-50 text-green-500"
          valueClass="text-green-600"
        />
        <StatCard
          icon={DollarSign}
          label="ยอดทั้งหมด"
          count={allActive.length}
          amount={grandTotal}
          accentClass="border-l-indigo-500"
          iconClass="bg-indigo-50 text-indigo-500"
          valueClass="text-indigo-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหางาน หรือชื่อลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-sans"
          />
        </div>
        <Select value={payFilter} onValueChange={(v) => setPayFilter(v as PaymentStatus | "all")}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Paid archive toggle — inline with toolbar */}
        {payFilter === "all" && (() => {
          const paidTasks = allActive.filter((t) => t.cashCollection.status === "paid" && (
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            customerMap.get(t.customerId)?.name.toLowerCase().includes(search.toLowerCase())
          ));
          if (paidTasks.length === 0) return null;
          return (
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors font-medium whitespace-nowrap",
                showArchive
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "bg-white border-dashed border-green-300 text-green-600 hover:bg-green-50"
              )}
            >
              <Archive className="w-4 h-4" />
              <span>เก็บเงินแล้ว ({paidTasks.length})</span>
              {showArchive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          );
        })()}
        <button
          onClick={() => {
            const rows = [
              ["\u0e0a\u0e37\u0e48\u0e2d\u0e07\u0e32\u0e19", "\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32", "\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32", "\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30", "\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23"],
              ...filtered.map((t) => {
                const cust = customerMap.get(t.customerId);
                const docs = (t.cashCollection.documents || []).map((d) => d.docType).join("/");
                const statusLabel: Record<string, string> = { unpaid: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e40\u0e01\u0e47\u0e1a\u0e40\u0e07\u0e34\u0e19", invoiced: "\u0e2a\u0e48\u0e07 Invoice \u0e41\u0e25\u0e49\u0e27", partial: "\u0e0a\u0e33\u0e23\u0e30\u0e1a\u0e32\u0e07\u0e2a\u0e48\u0e27\u0e19", paid: "\u0e0a\u0e33\u0e23\u0e30\u0e04\u0e23\u0e1a\u0e41\u0e25\u0e49\u0e27" };
                return [t.title, cust?.name || "", t.cashCollection.amount.toString(), statusLabel[t.cashCollection.status] || t.cashCollection.status, docs];
              })
            ];
            const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "cash-collection.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border bg-white hover:bg-muted transition-colors font-medium text-foreground whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Task List — active (non-paid) */}
      <div className="space-y-2.5">
        {filtered.filter((t) => payFilter !== "all" || t.cashCollection.status !== "paid").length === 0 && payFilter !== "paid" ? (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">ไม่พบรายการ</p>
          </div>
        ) : (
          filtered.filter((t) => payFilter === "paid" || t.cashCollection.status !== "paid").map((task) => {
            const customer = customerMap.get(task.customerId);
            const docs = task.cashCollection.documents || [];
            const docTypeCounts: Record<string, number> = {};
            docs.forEach((d) => {
              docTypeCounts[d.docType] = (docTypeCounts[d.docType] || 0) + 1;
            });

            return (
              <button
                key={task.id}
                onClick={() => navigate(`/ae/task/${task.id}?from=cash`)}
                className="w-full bg-white rounded-xl border border-border hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-4 text-left group"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5",
                    customer?.avatarColor || "bg-slate-400"
                  )}>
                    {customer?.avatarInitials || "??"}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: title + payment badge */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-indigo-600 transition-colors leading-snug min-w-0 flex-1">
                        {task.title}
                      </p>
                      <PaymentBadge status={task.cashCollection.status} className="whitespace-nowrap flex-shrink-0" />
                    </div>

                    {/* Row 2: customer + task status */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs text-muted-foreground">{customer?.name}</span>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <StatusBadge status={task.status} />
                    </div>

                    {/* Row 3: document chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {docs.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 italic">
                          <FilePlus className="w-3 h-3" />
                          ยังไม่มีเอกสาร — กดเพื่อเพิ่ม
                        </span>
                      ) : (
                        <>
                          {Object.entries(docTypeCounts).map(([type, count]) => (
                            <span
                              key={type}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium",
                                DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.other
                              )}
                            >
                              <FileText className="w-3 h-3" />
                              {type} {count > 1 && `×${count}`}
                            </span>
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({docs.length} ไฟล์)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-center">
                    <p className="font-bold text-sm text-foreground">{formatCurrency(task.cashCollection.amount)}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      {/* Archive Side Panel — paid tasks */}
      {(() => {
        const paidTasks = allActive.filter((t) => t.cashCollection.status === "paid" && (
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          customers.find((c) => c.id === t.customerId)?.name.toLowerCase().includes(search.toLowerCase())
        ));
        return (
          <ArchiveSidePanel
            open={payFilter === "all" && showArchive}
            onClose={() => setShowArchive(false)}
            title="เก็บเงินแล้ว"
            count={paidTasks.length}
            accentColor="green"
          >
            {paidTasks.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">ไม่มีรายการ</p>
            ) : (
              paidTasks.map((task) => {
                const customer = customers.find((c) => c.id === task.customerId);
                return (
                  <button
                    key={task.id}
                    onClick={() => { setShowArchive(false); navigate(`/ae/task/${task.id}?from=archive&tab=cash`); }}
                    className="w-full bg-white rounded-xl border border-border hover:border-green-300 hover:shadow-md transition-all duration-200 p-4 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", customer?.avatarColor || "bg-slate-400")}>
                        {customer?.avatarInitials || "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-green-700 transition-colors">{task.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer?.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-green-700">{formatCurrency(task.cashCollection.amount)}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </ArchiveSidePanel>
        );
      })()}
    </div>
  );
}

// ─── StatCard (same proportions as Customer CRM) ──────────────
function StatCard({
  icon: Icon, label, count, amount, accentClass, iconClass, valueClass,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  amount: number;
  accentClass: string;
  iconClass: string;
  valueClass: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-border border-l-4 p-3 sm:p-4 shadow-sm", accentClass)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center", iconClass)}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className={cn("text-xl sm:text-2xl font-extrabold", valueClass)}>{count}</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium leading-tight">{label}</p>
      <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5 tabular-nums">{formatCurrency(amount)}</p>
    </div>
  );
}
