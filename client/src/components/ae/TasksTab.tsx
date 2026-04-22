/**
 * TasksTab — Manage tasks grouped by project
 * Features: project sidebar, task list, create/edit task dialog, status/priority filters
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, ChevronDown, MoreHorizontal,
  Calendar, User, AlignLeft, ListTodo, Paperclip,
  UserPlus, X, CalendarDays, CheckSquare, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function getToday() {
  return new Date().toISOString().slice(0, 10);
}
function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Minimal Create Task Dialog ───────────────────────────────────────────────
interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: AppUser;
  appUsers: AppUser[];
  projects: Project[];
  defaultProjectId?: string;
  onSuccess: () => void;
}

function CreateTaskDialog({
  open, onOpenChange, currentUser, appUsers, projects, defaultProjectId, onSuccess
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([currentUser.id]);
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [dueDate, setDueDate] = useState("");
  const [showOtherDate, setShowOtherDate] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();
  const createItem = trpc.items.create.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      toast.success("สร้างงานสำเร็จ");
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setShowDescription(false);
      setAssigneeIds([currentUser.id]);
      setProjectId(defaultProjectId || "");
      setDueDate("");
      setShowOtherDate(false);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, defaultProjectId, currentUser.id]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setShowDescription(false);
    setAssigneeIds([currentUser.id]);
    setProjectId(defaultProjectId || "");
    setDueDate("");
    setShowOtherDate(false);
  }

  function handleCreate() {
    if (!title.trim()) { toast.error("กรุณาใส่ชื่องาน"); return; }
    createItem.mutate({
      title: title.trim(),
      description: description || undefined,
      type: "task",
      status: "todo",
      priority: "medium",
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  }

  const selectedProject = projects.find(p => p.id === projectId);
  const assignees = appUsers.filter(u => assigneeIds.includes(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden" showCloseButton={false}>
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title input — large, prominent */}
        <div className="px-8 pt-8 pb-4">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Press Enter to add task"
            rows={1}
            className="w-full resize-none text-2xl font-medium placeholder:text-muted-foreground/50 bg-transparent border-none outline-none focus:outline-none leading-snug"
            style={{ minHeight: "2.5rem" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
          />
        </div>

        {/* Row 1: Assignee + Project */}
        <div className="px-8 py-2 flex items-center gap-3">
          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />

          {/* Assignee pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignees.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-muted border border-border text-sm font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setShowAssigneePicker(true)}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  u.avatarColor || "bg-blue-500"
                )}>
                  {u.avatarInitials?.slice(0, 2) || u.name.slice(0, 2)}
                </div>
                <span>{u.name}</span>
              </div>
            ))}
            {assignees.length === 0 && (
              <button
                onClick={() => setShowAssigneePicker(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                เพิ่มผู้รับผิดชอบ
              </button>
            )}
            {assignees.length > 0 && (
              <button
                onClick={() => setShowAssigneePicker(true)}
                className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Project dropdown */}
          <Popover open={showProjectPicker} onOpenChange={setShowProjectPicker}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
                {selectedProject ? (
                  <>
                    <div className={cn("w-2.5 h-2.5 rounded-full", selectedProject.color || "bg-blue-500")} />
                    <span className="text-foreground font-medium">{selectedProject.name}</span>
                  </>
                ) : (
                  <>
                    <Folder className="w-3.5 h-3.5" />
                    <span>Default Group</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="start">
              <button
                onClick={() => { setProjectId(""); setShowProjectPicker(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted text-left"
              >
                <Folder className="w-4 h-4 text-muted-foreground" />
                ไม่ระบุโปรเจค
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setProjectId(p.id); setShowProjectPicker(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted text-left",
                    projectId === p.id && "bg-muted font-medium"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", p.color || "bg-blue-500")} />
                  {p.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Row 2: Date shortcuts */}
        <div className="px-8 py-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDueDate(dueDate === getToday() ? "" : getToday())}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                dueDate === getToday()
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
              )}
            >
              <span className="text-base">📅</span>
              Today
            </button>
            <button
              onClick={() => setDueDate(dueDate === getTomorrow() ? "" : getTomorrow())}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                dueDate === getTomorrow()
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
              )}
            >
              <span className="text-base">➡️</span>
              Tomorrow
            </button>
            <Popover open={showOtherDate} onOpenChange={setShowOtherDate}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    dueDate && dueDate !== getToday() && dueDate !== getTomorrow()
                      ? "bg-purple-50 border-purple-300 text-purple-700"
                      : "border-border text-muted-foreground hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                  )}
                >
                  <span className="text-base">📆</span>
                  {dueDate && dueDate !== getToday() && dueDate !== getTomorrow()
                    ? new Date(dueDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })
                    : "Other"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">เลือกวันที่</p>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); setShowOtherDate(false); }}
                    className="block w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {dueDate && (
                    <button
                      onClick={() => { setDueDate(""); setShowOtherDate(false); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ล้างวันที่
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Row 3: Add to Task List (project) */}
        <div className="px-8 py-2">
          <button
            onClick={() => setShowProjectPicker(true)}
            className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ListTodo className="w-4 h-4 flex-shrink-0 group-hover:text-primary" />
            <span>{selectedProject ? `เพิ่มใน ${selectedProject.name}` : "Add to Task List"}</span>
          </button>
        </div>

        {/* Row 4: Description */}
        <div className="px-8 py-2">
          {showDescription ? (
            <div className="flex items-start gap-2.5">
              <AlignLeft className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add Description"
                className="min-h-[80px] text-sm border-none bg-muted/30 focus-visible:ring-1 resize-none"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowDescription(true)}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <AlignLeft className="w-4 h-4 flex-shrink-0 group-hover:text-primary" />
              <span>Add Description</span>
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="h-6" />

        {/* Bottom bar */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3">
          {/* Left: attachment + more icons */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Assignee quick-add */}
          <button
            onClick={() => setShowAssigneePicker(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Subscribers</span>
          </button>

          {/* Right: Cancel + Create */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!title.trim() || createItem.isPending}
              className="min-w-[80px]"
            >
              {createItem.isPending ? "กำลังสร้าง..." : "Create"}
            </Button>
          </div>
        </div>

        {/* Assignee Picker Popover (rendered as overlay) */}
        {showAssigneePicker && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-4 w-72 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">เลือกผู้รับผิดชอบ</h3>
                <button onClick={() => setShowAssigneePicker(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {appUsers.map(u => {
                  const selected = assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setAssigneeIds(selected
                          ? assigneeIds.filter(id => id !== u.id)
                          : [...assigneeIds, u.id]
                        );
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                        u.avatarColor || "bg-blue-500"
                      )}>
                        {u.avatarInitials?.slice(0, 2) || u.name.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.companyRole}</div>
                      </div>
                      {selected && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <Button size="sm" className="w-full mt-3" onClick={() => setShowAssigneePicker(false)}>
                ตกลง
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Task Dialog (full form) ─────────────────────────────────────────────
interface EditTaskDialogProps {
  item: Item | null;
  onClose: () => void;
  appUsers: AppUser[];
  projects: Project[];
}

function EditTaskDialog({ item, onClose, appUsers, projects }: EditTaskDialogProps) {
  const [form, setForm] = useState<TaskFormData>(defaultForm);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (item) {
      setForm({
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
    }
  }, [item]);

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      toast.success("อัพเดทงานสำเร็จ");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!item) return;
    if (!form.title.trim()) { toast.error("กรุณาใส่ชื่องาน"); return; }
    updateItem.mutate({
      id: item.id,
      title: form.title.trim(),
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      assigneeIds: form.assigneeIds.length > 0 ? form.assigneeIds : undefined,
      responsibleId: form.responsibleId || undefined,
      dueDate: form.dueDate || undefined,
      endDate: form.endDate || undefined,
      projectId: form.projectId || undefined,
    });
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="text-lg font-semibold mb-4">แก้ไขงาน</div>
        <div className="space-y-4">
          <div>
            <Label>ชื่องาน *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>คำอธิบาย</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>สถานะ</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Item["status"] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [Item["status"], string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ความสำคัญ</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Item["priority"] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
            <Select value={form.projectId || "none"} onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? "" : v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกโปรเจค" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุโปรเจค</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ผู้รับผิดชอบหลัก</Label>
            <Select value={form.responsibleId || "none"} onValueChange={(v) => setForm({ ...form, responsibleId: v === "none" ? "" : v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกผู้รับผิดชอบ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {appUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ผู้ดำเนินงาน (Assignees)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {appUsers.map((u) => {
                const selected = form.assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => setForm({
                      ...form,
                      assigneeIds: selected
                        ? form.assigneeIds.filter((id) => id !== u.id)
                        : [...form.assigneeIds, u.id],
                    })}
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
              <Label>วันกำหนดส่ง</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>วันที่สิ้นสุด</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={updateItem.isPending}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main TasksTab ─────────────────────────────────────────────────────────────
export default function TasksTab({ currentUser }: TasksTabProps) {
  const [, navigate] = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
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

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
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

  const filteredItems = allItems.filter((item) => {
    if (selectedProjectId && item.projectId !== selectedProjectId) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getProjectById = (id: string | null | undefined) => projects.find((p) => p.id === id);
  const getUserById = (id: string | null | undefined) => appUsers.find((u) => u.id === id);

  const isOverdue = (item: Item) => {
    if (!item.dueDate || item.status === "done" || item.status === "cancelled") return false;
    return new Date(item.dueDate) < new Date(new Date().toISOString().slice(0, 10));
  };

  const taskCountByProject = (projectId: string) => allItems.filter((i) => i.projectId === projectId).length;

  return (
    <div className="flex h-full">
      {/* Project Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={() => setShowCreateProject(true)}>
            <Plus className="w-3.5 h-3.5" />
            สร้างโปรเจค
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
              !selectedProjectId ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                selectedProjectId === project.id ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            <Input placeholder="ค้นหางาน..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="สถานะ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">สถานะทั้งหมด</SelectItem>
              {(Object.entries(STATUS_LABELS) as [Item["status"], string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="ความสำคัญ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระดับ</SelectItem>
              {(Object.entries(PRIORITY_LABELS) as [Item["priority"], string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowCreateTask(true)}>
            <Plus className="w-3.5 h-3.5" />
            สร้างงาน
          </Button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">กำลังโหลด...</div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <CheckSquare className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">ยังไม่มีงาน</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreateTask(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                สร้างงานแรก
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredItems.map((item) => {
                const project = getProjectById(item.projectId);
                const responsible = getUserById(item.responsibleId);
                const assignees = Array.isArray(item.assigneeIds)
                  ? item.assigneeIds.map(id => getUserById(id)).filter(Boolean) as AppUser[]
                  : [];
                const overdue = isOverdue(item);

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer group transition-colors"
                    onClick={() => navigate(`/ae/item/${item.id}`)}
                  >
                    {/* Status toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = item.status === "done" ? "todo" : "done";
                        updateItem.mutate({ id: item.id, status: next });
                      }}
                      className={cn(
                        "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                        item.status === "done"
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground hover:border-primary"
                      )}
                    >
                      {item.status === "done" && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className={cn("text-sm font-medium flex-1 leading-snug", item.status === "done" && "line-through text-muted-foreground")}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge className={cn("text-xs px-1.5 py-0", PRIORITY_COLORS[item.priority])}>
                            {PRIORITY_LABELS[item.priority]}
                          </Badge>
                          <Badge className={cn("text-xs px-1.5 py-0", STATUS_COLORS[item.status])}>
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
                          <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                            <Calendar className="w-3 h-3" />
                            {new Date(item.dueDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                            {overdue && " (เกินกำหนด)"}
                          </span>
                        )}
                        {assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              {assignees.slice(0, 3).map(u => (
                                <div
                                  key={u.id}
                                  title={u.name}
                                  className={cn("w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold", u.avatarColor || "bg-blue-500")}
                                >
                                  {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                                </div>
                              ))}
                            </div>
                            {assignees.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{assignees.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-all flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}>
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <div className="text-lg font-semibold mb-4">สร้างโปรเจคใหม่</div>
          <div className="space-y-4">
            <div>
              <Label>ชื่อโปรเจค *</Label>
              <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="ชื่อโปรเจค" className="mt-1" />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="คำอธิบายโปรเจค" className="mt-1" rows={2} />
            </div>
            <div>
              <Label>สีโปรเจค</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectForm({ ...projectForm, color })}
                    className={cn("w-7 h-7 rounded-full transition-transform", color, projectForm.color === color && "ring-2 ring-offset-2 ring-primary scale-110")}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
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

      {/* Minimal Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        currentUser={currentUser}
        appUsers={appUsers}
        projects={projects}
        defaultProjectId={selectedProjectId || undefined}
        onSuccess={() => {}}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        item={editingItem}
        onClose={() => setEditingItem(null)}
        appUsers={appUsers}
        projects={projects}
      />
    </div>
  );
}
