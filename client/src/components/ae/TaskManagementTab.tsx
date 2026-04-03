/**
 * Task Management Tab
 * Shows all tasks with status, progress, customer info
 * Allows creating new tasks
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Filter, ChevronRight, Calendar,
  User, Briefcase, TrendingUp, Clock, CheckCircle2,
  AlertCircle, XCircle, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { db, Task, TaskStatus, getTaskProgress, formatCurrency, aeUsers } from "@/lib/database";
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

export default function TaskManagementTab() {
  const [, navigate] = useLocation();
  const { tasks, customers } = useDatabase();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);

  // Create task form state
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    contactName: "",
    aeId: "ae1",
    amount: "",
    brief: "",
  });

  const filtered = tasks.filter((t) => {
    const customer = customers.find((c) => c.id === t.customerId);
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      customer?.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    review: tasks.filter((t) => t.status === "review").length,
  };

  const handleCreate = () => {
    if (!form.customerId || !form.title || !form.contactName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const ae = aeUsers.find((a) => a.id === form.aeId);
    const newTask = db.createTask({
      customerId: form.customerId,
      title: form.title,
      contactName: form.contactName,
      aeId: form.aeId,
      aeName: ae?.name || "",
      amount: parseFloat(form.amount) || 0,
      brief: form.brief,
    });
    setShowCreate(false);
    setForm({ customerId: "", title: "", contactName: "", aeId: "ae1", amount: "", brief: "" });
    toast.success("สร้าง Task เรียบร้อยแล้ว");
    navigate(`/ae/task/${newTask.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <SelectTrigger className="w-48">
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

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่พบงาน</p>
            <p className="text-sm mt-1">ลองเปลี่ยนตัวกรองหรือสร้าง Task ใหม่</p>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              customer={customers.find((c) => c.id === task.customerId)}
              onClick={() => navigate(`/ae/task/${task.id}`)}
            />
          ))
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">สร้าง Task ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ลูกค้า <span className="text-red-500">*</span></Label>
              <Select value={form.customerId} onValueChange={(v) => {
                const c = customers.find((c) => c.id === v);
                setForm((f) => ({ ...f, customerId: v, contactName: c?.contactName || "" }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>ชื่องาน <span className="text-red-500">*</span></Label>
              <Input
                placeholder="เช่น แคมเปญ Social Media Q3/2025"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>ชื่อผู้ติดต่อ <span className="text-red-500">*</span></Label>
              <Input
                placeholder="ชื่อผู้ติดต่อฝั่งลูกค้า"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              />
            </div>

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

            <div className="space-y-1.5">
              <Label>Brief งาน (ไม่บังคับ)</Label>
              <Textarea
                placeholder="รายละเอียดงานเบื้องต้น..."
                value={form.brief}
                onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
                rows={3}
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
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
    <div className={cn("bg-white rounded-xl border border-border border-l-4 p-4 shadow-sm", colors[color])}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function TaskCard({
  task,
  customer,
  onClick,
}: {
  task: Task;
  customer: ReturnType<typeof useDatabase>["customers"][0] | undefined;
  onClick: () => void;
}) {
  const progress = getTaskProgress(task);
  const workDone = task.workItems.filter((w) => w.status === "done").length;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4 text-left group"
    >
      <div className="flex items-start gap-4">
        {/* Customer Avatar */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
            customer?.avatarColor || "bg-slate-400"
          )}
        >
          {customer?.avatarInitials || "??"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                {task.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {customer?.company} · {customer?.name}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={task.status} />
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          {/* Progress */}
          {task.workItems.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {workDone}/{task.workItems.length} Work
              </span>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {task.aeName}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {task.createdAt}
            </span>
            <span className="text-xs font-semibold text-foreground ml-auto">
              {formatCurrency(task.cashCollection.amount)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
