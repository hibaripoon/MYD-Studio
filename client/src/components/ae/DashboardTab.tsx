/**
 * Dashboard Tab — Revenue overview by Media, Product type, and AE
 * Design: Modern SaaS — Clean data visualization with Tailwind
 */
import { useMemo, useState } from "react";
import {
  TrendingUp, DollarSign, CheckCircle2, Clock, Users, BarChart3,
  PieChart, Calendar, ListFilter, X, ChevronRight,
} from "lucide-react";
import { useDatabase } from "@/contexts/DatabaseContext";
import { db } from "@/lib/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DateMode = "today" | "month" | "quarter" | "year" | "all" | "custom";

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MODE_LABELS: Record<DateMode, string> = {
  today: "วันนี้",
  month: "เดือนนี้",
  quarter: "ไตรมาสนี้",
  year: "ปีนี้",
  all: "ทั้งหมด",
  custom: "กำหนดเอง",
};

const BAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

function BarChart({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">ยังไม่มีข้อมูล</div>
  );
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-28 sm:w-36 text-xs text-muted-foreground truncate flex-shrink-0 text-right">{item.name}</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", BAR_COLORS[i % BAR_COLORS.length])}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-20 text-right flex-shrink-0">
              ฿{formatMoney(item.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardTab() {
  const { tasks, customers } = useDatabase();
  const [mode, setMode] = useState<DateMode>("month");
  const [customFrom, setCustomFrom] = useState(formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(formatDate(new Date()));
  const [showWorkList, setShowWorkList] = useState(false);

  // Work List filters
  const [wlFrom, setWlFrom] = useState("");
  const [wlTo, setWlTo] = useState("");
  const [wlMedia, setWlMedia] = useState("all");
  const [wlProduct, setWlProduct] = useState("all");
  const [wlAE, setWlAE] = useState("all");

  const users = useMemo(() => db.getUsers().filter((u) => u.role === "company"), []);
  const settings = db.getSettings();

  // Date range from mode
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    if (mode === "today") return { fromDate: today, toDate: new Date(today.getTime() + 86400000 - 1) };
    if (mode === "month") return { fromDate: new Date(now.getFullYear(), now.getMonth(), 1), toDate: now };
    if (mode === "quarter") return { fromDate: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), toDate: now };
    if (mode === "year") return { fromDate: new Date(now.getFullYear(), 0, 1), toDate: now };
    if (mode === "custom") return { fromDate: new Date(customFrom), toDate: new Date(customTo + "T23:59:59") };
    return { fromDate: new Date(0), toDate: now };
  }, [mode, customFrom, customTo]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const paid = t.cashCollection.status === "paid";
      if (!paid) return false;
      const paidDate = t.cashCollection.paidDate ? new Date(t.cashCollection.paidDate) : new Date(t.createdAt);
      return paidDate >= fromDate && paidDate <= toDate;
    });
  }, [tasks, fromDate, toDate]);

  // Summary stats
  const totalRevenue = useMemo(() => filteredTasks.reduce((s, t) => s + (t.cashCollection.amount || 0), 0), [filteredTasks]);
  const totalTasks = filteredTasks.length;
  const pendingTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
  const totalCustomers = customers.length;

  // Revenue by Media
  const revenueByMedia = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      if (t.revenueItems && t.revenueItems.length > 0) {
        t.revenueItems.forEach((item) => {
          const key = item.mediaName || "ไม่ระบุ";
          map[key] = (map[key] || 0) + item.amount;
        });
      } else {
        map["ไม่ระบุ"] = (map["ไม่ระบุ"] || 0) + (t.cashCollection.amount || 0);
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTasks]);

  // Revenue by Product Type
  const revenueByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      if (t.revenueItems && t.revenueItems.length > 0) {
        t.revenueItems.forEach((item) => {
          const key = item.productType || "ไม่ระบุ";
          map[key] = (map[key] || 0) + item.amount;
        });
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTasks]);

  // Revenue by AE
  const revenueByAE = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const user = users.find((u) => u.id === t.aeId);
      const name = user?.name || "ไม่ระบุ AE";
      map[name] = (map[name] || 0) + (t.cashCollection.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTasks, users]);

  // Top Customers
  const revenueByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const customer = customers.find((c) => c.id === t.customerId);
      const name = customer?.brandName || "ไม่ระบุ";
      map[name] = (map[name] || 0) + (t.cashCollection.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredTasks, customers]);

  // Work List — all revenue items from ALL paid tasks (not filtered by date range)
  const allWorkItems = useMemo(() => {
    const items: {
      taskId: string; taskTitle: string; mediaName: string; productType: string;
      amount: number; paidDate: string; aeId: string; aeName: string;
    }[] = [];
    tasks.forEach((t) => {
      if (t.cashCollection.status !== "paid") return;
      const aeName = users.find((u) => u.id === t.aeId)?.name || "ไม่ระบุ";
      const paidDate = t.cashCollection.paidDate || t.createdAt;
      if (t.revenueItems && t.revenueItems.length > 0) {
        t.revenueItems.forEach((item) => {
          items.push({
            taskId: t.id, taskTitle: t.title,
            mediaName: item.mediaName || "ไม่ระบุ",
            productType: item.productType || "ไม่ระบุ",
            amount: item.amount, paidDate, aeId: t.aeId || "", aeName,
          });
        });
      } else {
        items.push({
          taskId: t.id, taskTitle: t.title,
          mediaName: "ไม่ระบุ", productType: "ไม่ระบุ",
          amount: t.cashCollection.amount || 0, paidDate, aeId: t.aeId || "", aeName,
        });
      }
    });
    return items.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
  }, [tasks, users]);

  const filteredWorkItems = useMemo(() => {
    return allWorkItems.filter((item) => {
      if (wlFrom && item.paidDate < wlFrom) return false;
      if (wlTo && item.paidDate > wlTo + "T23:59:59") return false;
      if (wlMedia !== "all" && item.mediaName !== wlMedia) return false;
      if (wlProduct !== "all" && item.productType !== wlProduct) return false;
      if (wlAE !== "all" && item.aeId !== wlAE) return false;
      return true;
    });
  }, [allWorkItems, wlFrom, wlTo, wlMedia, wlProduct, wlAE]);

  const wlTotal = useMemo(() => filteredWorkItems.reduce((s, i) => s + i.amount, 0), [filteredWorkItems]);

  // Unique options for Work List filters
  const mediaOptions = useMemo(() => Array.from(new Set(allWorkItems.map((i) => i.mediaName))).sort(), [allWorkItems]);
  const productOptions = useMemo(() => Array.from(new Set(allWorkItems.map((i) => i.productType))).sort(), [allWorkItems]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {(Object.keys(MODE_LABELS) as DateMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                mode === m ? "bg-blue-600 text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowWorkList(true)}
          className="ml-auto gap-1.5 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <ListFilter className="w-3.5 h-3.5" />
          Work List
        </Button>
      </div>

      {/* Custom Date Range */}
      {mode === "custom" && (
        <div className="flex items-center gap-3 flex-wrap bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-muted-foreground">จาก</label>
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 text-xs w-36" />
            <label className="text-xs text-muted-foreground">ถึง</label>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 text-xs w-36" />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "รายได้รวม", value: `฿${formatMoney(totalRevenue)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "งานที่เก็บเงินแล้ว", value: `${totalTasks} งาน`, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "งานที่กำลังดำเนินการ", value: `${pendingTasks} งาน`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "ลูกค้าทั้งหมด", value: `${totalCustomers} ราย`, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", card.bg)}>
              <card.icon className={cn("w-4 h-4", card.color)} />
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Media */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">รายได้ตาม Media</p>
              <p className="text-xs text-muted-foreground">จาก Revenue Breakdown</p>
            </div>
          </div>
          <div className="p-5">
            <BarChart data={revenueByMedia} />
          </div>
        </div>

        {/* Revenue by Product Type */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">รายได้ตาม Product Type</p>
              <p className="text-xs text-muted-foreground">จาก Revenue Breakdown</p>
            </div>
          </div>
          <div className="p-5">
            <BarChart data={revenueByProduct} />
          </div>
        </div>
      </div>

      {/* Revenue by AE */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">รายได้ตาม AE</p>
            <p className="text-xs text-muted-foreground">ยอดรวมจากงานที่เก็บเงินแล้ว ตาม AE ที่เปิดงาน</p>
          </div>
        </div>
        <div className="p-5">
          <BarChart data={revenueByAE} />
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">ลูกค้าที่สร้างรายได้สูงสุด</p>
            <p className="text-xs text-muted-foreground">Top 5 ลูกค้า</p>
          </div>
        </div>
        <div className="p-5">
          <BarChart data={revenueByCustomer} />
        </div>
      </div>

      {/* Work List Side Panel */}
      {showWorkList && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowWorkList(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ListFilter className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Work List</p>
                <p className="text-xs text-muted-foreground">{filteredWorkItems.length} รายการ · ฿{formatMoney(wlTotal)}</p>
              </div>
              <button onClick={() => setShowWorkList(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">จากวันที่</label>
                  <Input type="date" value={wlFrom} onChange={(e) => setWlFrom(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">ถึงวันที่</label>
                  <Input type="date" value={wlTo} onChange={(e) => setWlTo(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Media</label>
                  <Select value={wlMedia} onValueChange={setWlMedia}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {mediaOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Product Type</label>
                  <Select value={wlProduct} onValueChange={setWlProduct}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {productOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">AE</label>
                  <Select value={wlAE} onValueChange={setWlAE}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(wlFrom || wlTo || wlMedia !== "all" || wlProduct !== "all" || wlAE !== "all") && (
                <button
                  onClick={() => { setWlFrom(""); setWlTo(""); setWlMedia("all"); setWlProduct("all"); setWlAE("all"); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  ล้าง filter ทั้งหมด
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredWorkItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">ไม่มีรายการที่ตรงกับ filter</div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredWorkItems.map((item, idx) => (
                    <div key={`${item.taskId}-${idx}`} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.taskTitle}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.mediaName}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{item.productType}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{item.aeName}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{item.paidDate.slice(0, 10)}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 flex-shrink-0">฿{formatMoney(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer total */}
            <div className="px-5 py-4 border-t border-border bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">ยอดรวม {filteredWorkItems.length} รายการ</span>
                <span className="text-lg font-bold text-emerald-600">฿{formatMoney(wlTotal)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
