/**
 * Cash Collection Tab
 * Dashboard summary of unpaid/invoiced tasks + payment status management
 * Clicking a task goes to the shared Task Detail page
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  DollarSign, AlertCircle, Clock, CheckCircle2, FileText,
  ChevronRight, TrendingUp, Filter, Search, Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { PaymentStatus, formatCurrency, getPaymentStatusLabel } from "@/lib/database";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const paymentFilters: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unpaid", label: "ยังไม่เก็บเงิน" },
  { value: "invoiced", label: "ส่ง Invoice แล้ว" },
  { value: "partial", label: "ชำระบางส่วน" },
  { value: "paid", label: "ชำระครบแล้ว" },
];

const payColors: Record<PaymentStatus, string> = {
  unpaid: "#ef4444",
  invoiced: "#3b82f6",
  partial: "#f97316",
  paid: "#22c55e",
};

export default function CashCollectionTab() {
  const [, navigate] = useLocation();
  const { tasks, customers } = useDatabase();
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState<PaymentStatus | "all">("all");

  const filtered = tasks
    .filter((t) => t.status !== "cancelled")
    .filter((t) => {
      const customer = customers.find((c) => c.id === t.customerId);
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase());
      const matchPay = payFilter === "all" || t.cashCollection.status === payFilter;
      return matchSearch && matchPay;
    });

  // Dashboard stats
  const allActive = tasks.filter((t) => t.status !== "cancelled");
  const unpaid = allActive.filter((t) => t.cashCollection.status === "unpaid");
  const invoiced = allActive.filter((t) => t.cashCollection.status === "invoiced");
  const partial = allActive.filter((t) => t.cashCollection.status === "partial");
  const paid = allActive.filter((t) => t.cashCollection.status === "paid");

  const totalUnpaid = unpaid.reduce((s, t) => s + t.cashCollection.amount, 0);
  const totalInvoiced = invoiced.reduce((s, t) => s + t.cashCollection.amount, 0);
  const totalPartial = partial.reduce((s, t) => s + t.cashCollection.amount, 0);
  const totalPaid = paid.reduce((s, t) => s + t.cashCollection.amount, 0);
  const grandTotal = allActive.reduce((s, t) => s + t.cashCollection.amount, 0);

  const chartData = [
    { name: "ยังไม่เก็บ", value: totalUnpaid, status: "unpaid" as PaymentStatus },
    { name: "Invoice แล้ว", value: totalInvoiced, status: "invoiced" as PaymentStatus },
    { name: "บางส่วน", value: totalPartial, status: "partial" as PaymentStatus },
    { name: "ชำระครบ", value: totalPaid, status: "paid" as PaymentStatus },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={AlertCircle}
          label="ยังไม่เก็บเงิน"
          count={unpaid.length}
          amount={totalUnpaid}
          colorClass="border-l-red-500 text-red-600"
          bgClass="bg-red-50"
        />
        <SummaryCard
          icon={FileText}
          label="ส่ง Invoice แล้ว"
          count={invoiced.length}
          amount={totalInvoiced}
          colorClass="border-l-blue-500 text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          icon={Clock}
          label="ชำระบางส่วน"
          count={partial.length}
          amount={totalPartial}
          colorClass="border-l-orange-500 text-orange-600"
          bgClass="bg-orange-50"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="ชำระครบแล้ว"
          count={paid.length}
          amount={totalPaid}
          colorClass="border-l-green-500 text-green-600"
          bgClass="bg-green-50"
        />
      </div>

      {/* Chart + Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-border p-5 shadow-sm">
          <p className="font-semibold text-foreground mb-4">สรุปมูลค่าตาม Status การชำระเงิน</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "มูลค่า"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={payColors[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">มูลค่างานทั้งหมด</p>
            <p className="text-3xl font-extrabold text-foreground">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="space-y-3 mt-4">
            {[
              { label: "รอเก็บเงิน", value: totalUnpaid + totalPartial, color: "text-red-600" },
              { label: "รอรับเงิน", value: totalInvoiced, color: "text-blue-600" },
              { label: "รับแล้ว", value: totalPaid, color: "text-green-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={cn("text-sm font-semibold", item.color)}>{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Collection Rate:{" "}
                <span className="font-semibold text-foreground">
                  {grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 0}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหางาน หรือชื่อลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={payFilter} onValueChange={(v) => setPayFilter(v as PaymentStatus | "all")}>
          <SelectTrigger className="w-52">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentFilters.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่พบรายการ</p>
          </div>
        ) : (
          filtered.map((task) => {
            const customer = customers.find((c) => c.id === task.customerId);
            return (
              <button
                key={task.id}
                onClick={() => navigate(`/ae/task/${task.id}`)}
                className="w-full bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0", customer?.avatarColor || "bg-slate-400")}>
                    {customer?.avatarInitials || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </p>
                      <PaymentBadge status={task.cashCollection.status} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm text-muted-foreground">{customer?.company}</span>
                      {task.cashCollection.invoiceNumber && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          {task.cashCollection.invoiceNumber}
                        </span>
                      )}
                      {task.cashCollection.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          ครบกำหนด {task.cashCollection.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground">{formatCurrency(task.cashCollection.amount)}</p>
                    <StatusBadge status={task.status} className="mt-1" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 flex-shrink-0" />
                </div>
                {task.cashCollection.note && (
                  <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                    {task.cashCollection.note}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, count, amount, colorClass, bgClass
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  amount: number;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-border border-l-4 p-4 shadow-sm", colorClass)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-2xl font-bold text-foreground">{count}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(amount)}</p>
    </div>
  );
}
