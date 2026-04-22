/**
 * MeetingsTab — Manage meetings with attendees, notes, and scheduling
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, MapPin, Clock, Users, MoreHorizontal,
  Calendar, Video, CheckCircle2, AlertCircle, Circle
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
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  type AppUser, type Item
} from "@/lib/database";

interface MeetingsTabProps {
  currentUser: AppUser;
}

interface MeetingFormData {
  title: string;
  description: string;
  status: Item["status"];
  priority: Item["priority"];
  assigneeIds: string[];
  responsibleId: string;
  dueDate: string;
  dueTime: string;
  endDate: string;
  endTime: string;
  location: string;
  projectId: string;
}

const defaultForm: MeetingFormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigneeIds: [],
  responsibleId: "",
  dueDate: "",
  dueTime: "",
  endDate: "",
  endTime: "",
  location: "",
  projectId: "",
};

type ViewFilter = "all" | "upcoming" | "past";

export default function MeetingsTab({ currentUser }: MeetingsTabProps) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<MeetingFormData>(defaultForm);

  const utils = trpc.useUtils();
  const { data: meetings = [], isLoading } = trpc.items.list.useQuery({ type: "meeting" });
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: appUsers = [] } = trpc.appUsers.list.useQuery();

  const createItem = trpc.items.create.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      setShowCreate(false);
      setForm(defaultForm);
      toast.success("สร้างการประชุมสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      setEditingItem(null);
      toast.success("อัพเดทการประชุมสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.items.delete.useMutation({
    onSuccess: () => {
      utils.items.list.invalidate();
      toast.success("ลบการประชุมสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0, 10);

  const filteredMeetings = meetings.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (viewFilter === "upcoming") return !m.dueDate || m.dueDate >= today;
    if (viewFilter === "past") return m.dueDate && m.dueDate < today;
    return true;
  });

  const handleOpenCreate = () => {
    setForm(defaultForm);
    setShowCreate(true);
  };

  const handleOpenEdit = (item: Item) => {
    setForm({
      title: item.title,
      description: item.description || "",
      status: item.status,
      priority: item.priority,
      assigneeIds: Array.isArray(item.assigneeIds) ? item.assigneeIds : [],
      responsibleId: item.responsibleId || "",
      dueDate: item.dueDate || "",
      dueTime: item.dueTime || "",
      endDate: item.endDate || "",
      endTime: item.endTime || "",
      location: item.location || "",
      projectId: item.projectId || "",
    });
    setEditingItem(item);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("กรุณาใส่ชื่อการประชุม"); return; }
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      type: "meeting" as const,
      status: form.status,
      priority: form.priority,
      assigneeIds: form.assigneeIds.length > 0 ? form.assigneeIds : undefined,
      responsibleId: form.responsibleId || undefined,
      dueDate: form.dueDate || undefined,
      dueTime: form.dueTime || undefined,
      endDate: form.endDate || undefined,
      endTime: form.endTime || undefined,
      location: form.location || undefined,
      projectId: form.projectId || undefined,
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload });
    } else {
      createItem.mutate(payload);
    }
  };

  const getUserById = (id: string | null | undefined) => appUsers.find((u) => u.id === id);
  const getProjectById = (id: string | null | undefined) => projects.find((p) => p.id === id);

  const getMeetingStatusIcon = (item: Item) => {
    if (item.status === "done") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (item.status === "cancelled") return <Circle className="w-5 h-5 text-gray-400" />;
    if (item.dueDate && item.dueDate < today) return <AlertCircle className="w-5 h-5 text-red-400" />;
    return <Video className="w-5 h-5 text-blue-500" />;
  };

  // Group meetings by date
  const groupedMeetings: Record<string, Item[]> = {};
  filteredMeetings.forEach((m) => {
    const key = m.dueDate || "ไม่ระบุวันที่";
    if (!groupedMeetings[key]) groupedMeetings[key] = [];
    groupedMeetings[key].push(m);
  });
  const sortedDates = Object.keys(groupedMeetings).sort();

  const formatDate = (dateStr: string) => {
    if (dateStr === "ไม่ระบุวันที่") return dateStr;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาการประชุม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "upcoming", "past"] as ViewFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewFilter(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                viewFilter === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {v === "all" ? "ทั้งหมด" : v === "upcoming" ? "กำลังมา" : "ผ่านมาแล้ว"}
            </button>
          ))}
        </div>

        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleOpenCreate}>
          <Plus className="w-3.5 h-3.5" />
          สร้างการประชุม
        </Button>
      </div>

      {/* Meeting List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Video className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">ไม่มีการประชุมในขณะนี้</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1" />
              สร้างการประชุมใหม่
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">{formatDate(dateKey)}</h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{groupedMeetings[dateKey].length} การประชุม</span>
                </div>

                <div className="space-y-2">
                  {groupedMeetings[dateKey].map((item) => {
                    const project = getProjectById(item.projectId);
                    const responsible = getUserById(item.responsibleId);
                    const assignees = Array.isArray(item.assigneeIds) ? item.assigneeIds : [];

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-border p-4 hover:shadow-sm transition-shadow cursor-pointer group"
                        onClick={() => navigate(`/ae/item/${item.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {getMeetingStatusIcon(item)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <p className={cn(
                                "text-sm font-semibold flex-1 min-w-0",
                                item.status === "done" && "line-through text-muted-foreground",
                                item.status === "cancelled" && "text-muted-foreground"
                              )}>
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", STATUS_COLORS[item.status])}>
                                  {STATUS_LABELS[item.status]}
                                </Badge>
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                            )}

                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              {(item.dueTime || item.endTime) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {item.dueTime || ""}
                                  {item.endTime && ` – ${item.endTime}`}
                                </span>
                              )}
                              {item.location && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </span>
                              )}
                              {project && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <div className={cn("w-2 h-2 rounded-full", project.color || "bg-blue-500")} />
                                  {project.name}
                                </span>
                              )}
                              {assignees.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  <span>{assignees.length} คน</span>
                                  <div className="flex -space-x-1">
                                    {assignees.slice(0, 3).map((aid) => {
                                      const u = getUserById(aid);
                                      return u ? (
                                        <div
                                          key={aid}
                                          title={u.name}
                                          className={cn(
                                            "w-5 h-5 rounded-full border border-white flex items-center justify-center text-white text-[9px] font-bold",
                                            u.avatarColor || "bg-blue-500"
                                          )}
                                        >
                                          {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Meeting Dialog */}
      <Dialog open={showCreate || !!editingItem} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingItem(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไขการประชุม" : "สร้างการประชุมใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อการประชุม *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ชื่อการประชุม"
                className="mt-1"
              />
            </div>
            <div>
              <Label>วาระการประชุม / คำอธิบาย</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="วาระการประชุมหรือรายละเอียด"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>สถานะ</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Item["status"] })}>
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
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Item["priority"] })}>
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
              <Label>สถานที่ประชุม</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="ห้องประชุม / ลิงก์ออนไลน์"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>วันที่ประชุม</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>วันที่สิ้นสุด</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>เวลาเริ่ม</Label>
                <Input
                  type="time"
                  value={form.dueTime}
                  onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>เวลาสิ้นสุด</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>โปรเจค</Label>
              <Select value={form.projectId || "none"} onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? "" : v })}>
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
              <Label>ผู้รับผิดชอบ (Responsible)</Label>
              <Select value={form.responsibleId || "none"} onValueChange={(v) => setForm({ ...form, responsibleId: v === "none" ? "" : v })}>
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
              <Label>ผู้เข้าร่วมประชุม (Attendees)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {appUsers.map((u) => {
                  const selected = form.assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setForm({
                          ...form,
                          assigneeIds: selected
                            ? form.assigneeIds.filter((id) => id !== u.id)
                            : [...form.assigneeIds, u.id],
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingItem(null); }}>ยกเลิก</Button>
            <Button
              onClick={handleSubmit}
              disabled={createItem.isPending || updateItem.isPending}
            >
              {editingItem ? "บันทึก" : "สร้างการประชุม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
