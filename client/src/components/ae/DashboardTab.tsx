/**
 * Dashboard Tab — Revenue overview by Media, Product type, and AE
 * Design: Modern SaaS — Clean data visualization with Tailwind
 */
import { useMemo, useState } from "react";
import { TrendingUp, DollarSign, CheckCircle2, Clock, Users, BarChart3, PieChart, Calendar } from "lucide-react";
import { useDatabase } from "@/contexts/DatabaseContext";
import { db } from "@/lib/database";
import { cn } from "@/lib/utils";

type DateRange = "month" | "quarter" | "year" | "all";

function formatMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getDateFilter(range: DateRange): Date {
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(0);
}

const RANGE_LABELS: Record<DateRange, string> = {
  month: "เดือนนี้",
  quarter: "ไตรมาสนี้",
  year: "ปีนี้",
  all: "ทั้งหมด",
};

const BAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

function BarChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
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
  const [range, setRange] = useState<DateRange>("month");

  const users = useMemo(() => db.getUsers().filter((u) => u.role === "company"), []);

  const filteredTasks = useMemo(() => {
    const cutoff = getDateFilter(range);
    return tasks.filter((t) => {
      const paid = t.cashCollection.status === "paid";
      if (!paid) return false;
      const paidDate = t.cashCollection.paidDate ? new Date(t.cashCollection.paidDate) : new Date(t.createdAt);
      return paidDate >= cutoff;
    });
  }, [tasks, range]);

  // Summary stats
  const totalRevenue = useMemo(() => filteredTasks.reduce((s, t) => s + (t.cashCollection.amount || 0), 0), [filteredTasks]);
  const totalTasks = filteredTasks.length;
  const pendingTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;
  const totalCustomers = customers.length;

  // Revenue by Media (from revenueItems)
  const revenueByMedia = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      if (t.revenueItems && t.revenueItems.length > 0) {
        t.revenueItems.forEach((item) => {
          if (item.category === "media") {
            map[item.name] = (map[item.name] || 0) + item.amount;
          }
        });
      } else {
        // fallback: use task amount under "ไม่ระบุ Media"
        map["ไม่ระบุ"] = (map["ไม่ระบุ"] || 0) + (t.cashCollection.amount || 0);
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTasks]);

  // Revenue by Product
  const revenueByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      if (t.revenueItems && t.revenueItems.length > 0) {
        t.revenueItems.forEach((item) => {
          if (item.category === "product") {
            map[item.name] = (map[item.name] || 0) + item.amount;
          }
        });
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTasks]);

  // Revenue by AE
  const revenueByAE = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const user = users.find((u) => u.id === t.aeId);
      const name = user?.name || "ไม่ระบุ";
      map[name] = (map[name] || 0) + (t.cashCollection.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTasks, users]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              range === r
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

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
            <BarChart data={revenueByMedia} label="Media" />
          </div>
        </div>

        {/* Revenue by Product */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">รายได้ตาม Product / Service</p>
              <p className="text-xs text-muted-foreground">จาก Revenue Breakdown</p>
            </div>
          </div>
          <div className="p-5">
            {revenueByProduct.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                ยังไม่มีข้อมูล — เพิ่ม Revenue Breakdown ใน Task Detail
              </div>
            ) : (
              <BarChart data={revenueByProduct} label="Product" />
            )}
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
            <p className="text-xs text-muted-foreground">ยอดรวมจากงานที่เก็บเงินแล้ว</p>
          </div>
        </div>
        <div className="p-5">
          <BarChart data={revenueByAE} label="AE" />
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
          <BarChart
            data={useMemo(() => {
              const map: Record<string, number> = {};
              filteredTasks.forEach((t) => {
                const customer = customers.find((c) => c.id === t.customerId);
                const name = customer?.brandName || "ไม่ระบุ";
                map[name] = (map[name] || 0) + (t.cashCollection.amount || 0);
              });
              return Object.entries(map)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [filteredTasks, customers])}
            label="Customer"
          />
        </div>
      </div>
    </div>
  );
}
