/**
 * DashboardTab — Overview of tasks and meetings
 * Shows: task counts by status, upcoming items, recent activity
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2, Clock, AlertCircle, Users, Calendar, Video,
  CheckSquare, TrendingUp, ArrowRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/database";
import type { Item } from "@/lib/database";

export default function DashboardTab() {
  const [, navigate] = useLocation();
  const { data: allItems = [] } = trpc.items.list.useQuery({});
  const { data: appUsers = [] } = trpc.appUsers.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  const today = new Date().toISOString().slice(0, 10);
  const tasks = useMemo(() => allItems.filter((i) => i.type === "task"), [allItems]);
  const meetings = useMemo(() => allItems.filter((i) => i.type === "meeting"), [allItems]);

  // Task stats
  const taskStats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done" && t.status !== "cancelled").length,
  }), [tasks, today]);

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    return meetings
      .filter((m) => m.dueDate && m.dueDate >= today && m.dueDate <= nextWeekStr && m.status !== "cancelled")
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 5);
  }, [meetings, today]);

  // Overdue tasks
  const overdueTasks = useMemo(() =>
    tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done" && t.status !== "cancelled")
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 5),
    [tasks, today]
  );

  // In-progress tasks
  const inProgressTasks = useMemo(() =>
    tasks.filter((t) => t.status === "in_progress" || t.status === "review")
      .sort((a, b) => (a.dueDate ?? "zzz").localeCompare(b.dueDate ?? "zzz"))
      .slice(0, 5),
    [tasks]
  );

  const getUserById = (id: string | null | undefined) => appUsers.find((u) => u.id === id);

  const StatCard = ({ label, value, icon: Icon, color, onClick }: {
    label: string; value: number; icon: React.ElementType; color: string; onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow text-left w-full",
        onClick && "cursor-pointer"
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );

  const ItemRow = ({ item }: { item: Item }) => {
    const responsible = getUserById(item.responsibleId);
    return (
      <button
        onClick={() => navigate(`/ae/item/${item.id}`)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
      >
        {item.type === "meeting"
          ? <Video className="w-4 h-4 text-purple-500 flex-shrink-0" />
          : <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.dueDate && (
              <span className="text-xs text-muted-foreground">{item.dueDate}</span>
            )}
            {responsible && (
              <span className="text-xs text-muted-foreground">• {responsible.name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", STATUS_COLORS[item.status])}>
            {STATUS_LABELS[item.status]}
          </Badge>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">ภาพรวมงาน</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="งานทั้งหมด" value={taskStats.total} icon={CheckSquare} color="bg-slate-500" />
          <StatCard label="รอดำเนินการ" value={taskStats.todo} icon={Clock} color="bg-gray-400" />
          <StatCard label="กำลังทำ" value={taskStats.in_progress} icon={TrendingUp} color="bg-blue-500" />
          <StatCard label="รอตรวจสอบ" value={taskStats.review} icon={CheckCircle2} color="bg-amber-500" />
          <StatCard label="เสร็จแล้ว" value={taskStats.done} icon={CheckCircle2} color="bg-green-500" />
          <StatCard label="เกินกำหนด" value={taskStats.overdue} icon={AlertCircle} color="bg-red-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Tasks */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              งานเกินกำหนด
              {overdueTasks.length > 0 && (
                <Badge variant="destructive" className="text-xs">{overdueTasks.length}</Badge>
              )}
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/ae/tasks")}>
              ดูทั้งหมด
            </Button>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">ไม่มีงานเกินกำหนด</p>
            </div>
          ) : (
            <div className="space-y-1">
              {overdueTasks.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              กำลังดำเนินการ
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/ae/tasks")}>
              ดูทั้งหมด
            </Button>
          </div>
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">ไม่มีงานที่กำลังดำเนินการ</p>
            </div>
          ) : (
            <div className="space-y-1">
              {inProgressTasks.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-500" />
              การประชุมที่กำลังมา
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/ae/meetings")}>
              ดูทั้งหมด
            </Button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">ไม่มีการประชุมในสัปดาห์นี้</p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingMeetings.map((item) => <ItemRow key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>

      {/* Team & Projects Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            ทีมงาน ({appUsers.length} คน)
          </h3>
          <div className="flex flex-wrap gap-2">
            {appUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  u.avatarColor || "bg-blue-500"
                )}>
                  {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                </div>
                <span className="text-xs font-medium">{u.name}</span>
              </div>
            ))}
            {appUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">ยังไม่มีสมาชิกในทีม</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            โปรเจค ({projects.length} โปรเจค)
          </h3>
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => {
              const count = allItems.filter((i) => i.projectId === p.id).length;
              const done = allItems.filter((i) => i.projectId === p.id && i.status === "done").length;
              const pct = count > 0 ? Math.round((done / count) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", p.color || "bg-blue-500")} />
                  <span className="text-xs flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{done}/{count}</span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="text-xs text-muted-foreground">ยังไม่มีโปรเจค</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
