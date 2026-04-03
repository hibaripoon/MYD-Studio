/**
 * Task Management Tab
 * Shows all tasks with status, progress, customer info
 * Create Task: searchable customer selector, contact phone/email, large brief box
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Filter, ChevronRight, Calendar,
  User, Briefcase, TrendingUp, Clock, CheckCircle2,
  Phone, Mail, ChevronDown, ChevronUp, X, Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { db, Task, TaskStatus, Customer, getTaskProgress, formatCurrency, aeUsers, getSession, CAN_SEE_ALL_TASKS } from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusFilters: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "review", label: "รอ Review" },
  { value: "done", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

// ─── Searchable Customer Combobox ─────────────────────────────

function CustomerCombobox({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: string;
  onChange: (customerId: string, customer: Customer | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value);
  const filtered = customers.filter((c) =>
    c.brandName.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={cn(
          "w-full flex items-center justify-between gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm",
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors",
          !selected && "text-muted-foreground"
        )}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0", selected.avatarColor)}>
              {selected.avatarInitials}
            </div>
            <span className="truncate font-medium">{selected.brandName}</span>
          </div>
        ) : (
          <span>ค้นหาและเลือกลูกค้า...</span>
        )}
        <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="พิมพ์ชื่อแบรนด์หรือผู้ติดต่อ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">ไม่พบลูกค้า</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id, c); setOpen(false); setSearch(""); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                    value === c.id && "bg-blue-50"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", c.avatarColor)}>
                    {c.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.brandName}</p>
                    {c.contactName && <p className="text-xs text-muted-foreground truncate">{c.contactName}</p>}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.type}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function TaskManagementTab() {
  const [, navigate] = useLocation();
  const { tasks, customers } = useDatabase();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  // Determine current user's role and aeId for task filtering
  const session = getSession();
  const currentUser = session ? db.getUserById(session.userId) : null;
  const isAEOnly = currentUser?.companyRole === "ae";
  const currentAeId = currentUser?.aeId || null;

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    aeId: currentAeId || "ae1",
    amount: "",
    brief: "",
  });

  // AE role: only see own tasks. Admin/Head/Sub Admin: see all
  const visibleTasks = isAEOnly && currentAeId
    ? tasks.filter((t) => t.aeId === currentAeId)
    : tasks;

  const filtered = visibleTasks.filter((t) => {
    const customer = customers.find((c) => c.id === t.customerId);
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      customer?.brandName.toLowerCase().includes(search.toLowerCase()) ||
      (customer?.contactName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const handleCustomerChange = (customerId: string, customer: Customer | null) => {
    setForm((f) => ({
      ...f,
      customerId,
      contactName: customer?.contactName || "",
      contactPhone: customer?.contactPhone || "",
      contactEmail: customer?.contactEmail || "",
    }));
  };

  const handleCreate = () => {
    if (!form.customerId || !form.title || !form.contactName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน (ลูกค้า, ชื่องาน, ผู้ติดต่อ)");
      return;
    }
    const ae = aeUsers.find((a) => a.id === form.aeId);
    const newTask = db.createTask({
      customerId: form.customerId,
      title: form.title,
      contactName: form.contactName,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      aeId: form.aeId,
      aeName: ae?.name || "",
      amount: parseFloat(form.amount) || 0,
      brief: form.brief,
    });
    setShowCreate(false);
    setForm({ customerId: "", title: "", contactName: "", contactPhone: "", contactEmail: "", aeId: "ae1", amount: "", brief: "" });
    toast.success("สร้าง Task เรียบร้อยแล้ว");
    navigate(`/ae/task/${newTask.id}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Briefcase} label="งานทั้งหมด" value={stats.total} color="blue" />
        <StatCard icon={TrendingUp} label="กำลังดำเนินการ" value={stats.inProgress} color="blue" />
        <StatCard icon={Clock} label="รอ Review" value={stats.review} color="purple" />
        <StatCard icon={CheckCircle2} label="เสร็จสิ้น" value={stats.done} color="green" />
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          สร้าง Task
        </Button>
      </div>

      {/* Task List — active (non-done) */}
      <div className="space-y-3">
        {filtered.filter((t) => statusFilter !== "all" || t.status !== "done").length === 0 && statusFilter !== "done" ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่พบงาน</p>
            <p className="text-sm mt-1">ลองเปลี่ยนตัวกรองหรือสร้าง Task ใหม่</p>
          </div>
        ) : (
          filtered.filter((t) => statusFilter === "done" || t.status !== "done").map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              customer={customers.find((c) => c.id === task.customerId)}
              onClick={() => navigate(`/ae/task/${task.id}`)}
            />
          ))
        )}
      </div>

      {/* Archive — done tasks */}
      {statusFilter === "all" && (() => {
        const doneTasks = filtered.filter((t) => t.status === "done");
        if (doneTasks.length === 0) return null;
        return (
          <div className="mt-2">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600">งานเสร็จสิ้นแล้ว ({doneTasks.length} งาน)</span>
              </div>
              {showArchive ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {showArchive && (
              <div className="mt-2 space-y-2">
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    customer={customers.find((c) => c.id === task.customerId)}
                    onClick={() => navigate(`/ae/task/${task.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">สร้าง Task ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Customer Search */}
            <div className="space-y-1.5">
              <Label>ลูกค้า <span className="text-red-500">*</span></Label>
              <CustomerCombobox
                customers={customers}
                value={form.customerId}
                onChange={handleCustomerChange}
              />
            </div>

            {/* Task Title */}
            <div className="space-y-1.5">
              <Label>ชื่องาน <span className="text-red-500">*</span></Label>
              <Input
                placeholder="เช่น แคมเปญ Social Media Q3/2025"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Contact Info */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                ข้อมูลผู้ติดต่อฝั่งลูกค้า
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>ชื่อผู้ติดต่อ <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="ชื่อผู้ติดต่อ"
                      value={form.contactName}
                      onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>เบอร์โทร</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="08x-xxx-xxxx"
                        value={form.contactPhone}
                        onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>อีเมล</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        type="email"
                        placeholder="email@..."
                        value={form.contactEmail}
                        onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AE + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>AE ที่รับผิดชอบ</Label>
                <Select value={form.aeId} onValueChange={(v) => setForm((f) => ({ ...f, aeId: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aeUsers.map((ae) => (
                      <SelectItem key={ae.id} value={ae.id}>{ae.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>มูลค่างาน (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            {/* Brief — large box */}
            <div className="space-y-1.5">
              <Label>Brief งาน</Label>
              <Textarea
                placeholder="รายละเอียดงาน เป้าหมาย ความต้องการของลูกค้า..."
                value={form.brief}
                onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              สร้าง Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-l-blue-500",
    green: "bg-green-50 text-green-600 border-l-green-500",
    orange: "bg-orange-50 text-orange-600 border-l-orange-500",
    purple: "bg-purple-50 text-purple-600 border-l-purple-500",
    red: "bg-red-50 text-red-600 border-l-red-500",
  };
  return (
    <div className={cn("bg-white rounded-xl border border-border border-l-4 p-3 sm:p-4 shadow-sm", colors[color])}>
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 opacity-70" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────

function TaskCard({
  task, customer, onClick,
}: {
  task: Task;
  customer: Customer | undefined;
  onClick: () => void;
}) {
  const progress = getTaskProgress(task);
  const workDone = task.workItems.filter((w) => w.status === "done").length;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4 text-left group"
    >
        <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0", customer?.avatarColor || "bg-slate-400")}>
          {customer?.avatarInitials || "??"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                {task.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {customer?.brandName || "ไม่ระบุลูกค้า"}
              </p>
            </div>
            <StatusBadge status={task.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.aeName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {task.createdAt}
            </span>
            <span className="ml-auto font-semibold text-foreground text-sm whitespace-nowrap">
              {formatCurrency(task.cashCollection.amount)}
            </span>
          </div>

          {task.workItems.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {workDone}/{task.workItems.length} งาน
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
      </div>
    </button>
  );
}
