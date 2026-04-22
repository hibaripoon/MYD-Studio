/**
 * TasksTab — Manage tasks grouped by project
 * Features: project sidebar, task list, create/edit task dialog, status/priority filters
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, Filter, ChevronDown, MoreHorizontal,
  Calendar, User, Flag, Folder, CheckSquare, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, PROJECT_COLORS,
  type AppUser, type Item, type Project
} from "@/lib/database";

interface TasksTabProps {
  currentUser: AppUser;
}

type StatusFilter = "all" | Item["status"];
type PriorityFilter = "all" | Item["priority"];

interface TaskFormData {
  title: string;
  description: string;
  status: Item["status"];
  priority: Item["priority"];
  assigneeIds: string[];
  responsibleId: string;
  dueDate: string;
  endDate: string;
  projectId: string;
}

const defaultForm: TaskFormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigneeIds: [],
  responsibleId: "",
  dueDate: "",
  endDate: "",
  projectId: "",
};

export default function TasksTab({ currentUser }: TasksTabProps) {
  const [, navigate] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultForm);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", color: "bg-blue-500" });

  const utils = trpc.useUtils();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: allItems = [], isLoading } = trpc.items.list.useQuery({ type: "task" });
  const { data: appUsers = [] } = trpc.appUsers.list.useQuery();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setShowCreateProject(false);
      setProjectForm({ name: "", description: "", color: "bg-blue-500" });
      toast.success("สร้างโปรเจคสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const createItem = trpc.items.create.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      setShowCreateTask(false);
      setTaskForm(defaultForm);
      toast.success("สร้างงานสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      setEditingItem(null);
      toast.success("อัพเดทงานสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.items.delete.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      toast.success("ลบงานสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  // Filter tasks
  const filteredItems = allItems.filter((item) => {
    if (selectedProjectId && item.projectId !== selectedProjectId) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setTaskForm({ ...defaultForm, projectId: selectedProjectId || "" });
    setShowCreateTask(true);
  };

  const handleOpenEdit = (item: Item) => {
    setTaskForm({
      title: item.title,
      description: item.description || "",
      status: item.status,
      priority: item.priority,
      assigneeIds: Array.isArray(item.assigneeIds) ? item.assigneeIds : [],
      responsibleId: item.responsibleId || "",
      dueDate: item.dueDate || "",
      endDate: item.endDate || "",
      projectId: item.projectId || "",
    });
    setEditingItem(item);
  };

  const handleSubmitTask = () => {
    if (!taskForm.title.trim()) { toast.error("กรุณาใส่ชื่องาน"); return; }
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description || undefined,
      type: "task" as const,
      status: taskForm.status,
      priority: taskForm.priority,
      assigneeIds: taskForm.assigneeIds.length > 0 ? taskForm.assigneeIds : undefined,
      responsibleId: taskForm.responsibleId || undefined,
      dueDate: taskForm.dueDate || undefined,
      endDate: taskForm.endDate || undefined,
      projectId: taskForm.projectId || undefined,
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload });
    } else {
      createItem.mutate(payload);
    }
  };

  const handleStatusChange = (item: Item, status: Item["status"]) => {
    updateItem.mutate({ id: item.id, status });
  };

  const getProjectById = (id: string | null | undefined) =>
    projects.find((p) => p.id === id);

  const getUserById = (id: string | null | undefined) =>
    appUsers.find((u) => u.id === id);

  const isOverdue = (item: Item) => {
    if (!item.dueDate || item.status === "done" || item.status === "cancelled") return false;
    return new Date(item.dueDate) < new Date(new Date().toISOString().slice(0, 10));
  };

  const taskCountByProject = (projectId: string) =>
    allItems.filter((i) => i.projectId === projectId).length;

  return (
    <div className="flex h-full">
      {/* Project Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={() => setShowCreateProject(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            สร้างโปรเจค
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              !selectedProjectId
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">งานทั้งหมด</span>
            <span className="text-xs opacity-70">{allItems.length}</span>
          </button>

          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left mt-0.5",
                selectedProjectId === project.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", project.color || "bg-blue-500")} />
              <span className="flex-1 truncate">{project.name}</span>
              <span className="text-xs opacity-70">{taskCountByProject(project.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหางาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">สถานะทั้งหมด</SelectItem>
              {(Object.entries(STATUS_LABELS) as [Item["status"], string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="ความสำคัญ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระดับ</SelectItem>
              {(Object.entries(PRIORITY_LABELS) as [Item["priority"], string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleOpenCreate}>
            <Plus className="w-3.5 h-3.5" />
            สร้างงาน
          </Button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CheckSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">ไม่มีงานในขณะนี้</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1" />
                สร้างงานใหม่
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const project = getProjectById(item.projectId);
                const responsible = getUserById(item.responsibleId);
                const overdue = isOverdue(item);
                const assignees = Array.isArray(item.assigneeIds) ? item.assigneeIds : [];

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white rounded-lg border border-border p-3 hover:shadow-sm transition-shadow cursor-pointer group",
                      overdue && "border-l-4 border-l-red-400"
                    )}
                    onClick={() => navigate(`/ae/item/${item.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status toggle */}
                      <button
                        className="mt-0.5 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = item.status === "done" ? "todo" : item.status === "todo" ? "in_progress" : item.status === "in_progress" ? "review" : "done";
                          handleStatusChange(item, next);
                        }}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          item.status === "done" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-primary"
                        )}>
                          {item.status === "done" && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className={cn(
                            "text-sm font-medium flex-1 min-w-0",
                            item.status === "done" && "line-through text-muted-foreground"
                          )}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", PRIORITY_COLORS[item.priority])}>
                              {PRIORITY_LABELS[item.priority]}
                            </Badge>
                            <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", STATUS_COLORS[item.status])}>
                              {STATUS_LABELS[item.status]}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {project && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className={cn("w-2 h-2 rounded-full", project.color || "bg-blue-500")} />
                              {project.name}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className={cn(
                              "flex items-center gap-1 text-xs",
                              overdue ? "text-red-500 font-medium" : "text-muted-foreground"
                            )}>
                              {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                              {item.dueDate}
                              {item.endDate && item.endDate !== item.dueDate && ` → ${item.endDate}`}
                            </span>
                          )}
                          {responsible && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {responsible.name}
                            </span>
                          )}
                          {assignees.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="text-muted-foreground/60">ผู้รับผิดชอบ:</span>
                              {assignees.slice(0, 2).map((aid) => {
                                const u = getUserById(aid);
                                return u ? (
                                  <span key={aid} className={cn(
                                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold",
                                    u.avatarColor || "bg-blue-500"
                                  )}>
                                    {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                                  </span>
                                ) : null;
                              })}
                              {assignees.length > 2 && <span className="text-xs text-muted-foreground">+{assignees.length - 2}</span>}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}>
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); deleteItem.mutate({ id: item.id }); }}
                          >
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างโปรเจคใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อโปรเจค *</Label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="ชื่อโปรเจค"
                className="mt-1"
              />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="คำอธิบายโปรเจค"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>สีโปรเจค</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectForm({ ...projectForm, color })}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      color,
                      projectForm.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>ยกเลิก</Button>
            <Button
              onClick={() => createProject.mutate({ ...projectForm, ownerId: currentUser.id })}
              disabled={!projectForm.name.trim() || createProject.isPending}
            >
              สร้างโปรเจค
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Task Dialog */}
      <Dialog open={showCreateTask || !!editingItem} onOpenChange={(open) => { if (!open) { setShowCreateTask(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไขงาน" : "สร้างงานใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่องาน *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="ชื่องาน"
                className="mt-1"
              />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="รายละเอียดงาน"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>สถานะ</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Item["status"] })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_LABELS) as [Item["status"], string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ความสำคัญ</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as Item["priority"] })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORITY_LABELS) as [Item["priority"], string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>โปรเจค</Label>
              <Select value={taskForm.projectId || "none"} onValueChange={(v) => setTaskForm({ ...taskForm, projectId: v === "none" ? "" : v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกโปรเจค" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุโปรเจค</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ผู้รับผิดชอบหลัก (Responsible)</Label>
              <Select value={taskForm.responsibleId || "none"} onValueChange={(v) => setTaskForm({ ...taskForm, responsibleId: v === "none" ? "" : v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ</SelectItem>
                  {appUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ผู้ดำเนินงาน (Assignees)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {appUsers.map((u) => {
                  const selected = taskForm.assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setTaskForm({
                          ...taskForm,
                          assigneeIds: selected
                            ? taskForm.assigneeIds.filter((id) => id !== u.id)
                            : [...taskForm.assigneeIds, u.id],
                        });
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold", u.avatarColor || "bg-blue-500")}>
                        {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                      </div>
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>วันที่เริ่ม / กำหนดส่ง</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>วันที่สิ้นสุด</Label>
                <Input
                  type="date"
                  value={taskForm.endDate}
                  onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateTask(false); setEditingItem(null); }}>ยกเลิก</Button>
            <Button
              onClick={handleSubmitTask}
              disabled={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? "บันทึก" : "สร้างงาน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
