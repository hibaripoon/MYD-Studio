/**
 * ItemDetailPage — Detail view for tasks and meetings
 * Shows full details, comments, and meeting notes
 */
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Users, Flag,
  MessageSquare, FileText, Edit2, Trash2, Send, CheckCircle2,
  AlertCircle, Circle, Video, CheckSquare, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  getSession
} from "@/lib/database";

export default function ItemDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, navigate] = useLocation();
  const [commentText, setCommentText] = useState("");
  const [noteText, setNoteText] = useState("");

  const utils = trpc.useUtils();
  const session = getSession();

  const { data: item, isLoading } = trpc.items.getById.useQuery({ id: params.itemId });
  const { data: appUsers = [] } = trpc.appUsers.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: comments = [] } = trpc.itemComments.list.useQuery({ itemId: params.itemId });
  const { data: notes = [] } = trpc.meetingNotes.list.useQuery({ itemId: params.itemId });

  const { data: currentUserData } = trpc.appUsers.list.useQuery(undefined, {
    select: (users) => users.find((u) => u.id === session?.userId),
  });

  const updateItem = trpc.items.update.useMutation({
    onSuccess: () => {
      utils.items.getById.invalidate({ id: params.itemId });
      toast.success("อัพเดทสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const createComment = trpc.itemComments.create.useMutation({
    onSuccess: () => {
      utils.itemComments.list.invalidate({ itemId: params.itemId });
      setCommentText("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteComment = trpc.itemComments.delete.useMutation({
    onSuccess: () => utils.itemComments.list.invalidate({ itemId: params.itemId }),
    onError: (e) => toast.error(e.message),
  });

  const createNote = trpc.meetingNotes.create.useMutation({
    onSuccess: () => {
      utils.meetingNotes.list.invalidate({ itemId: params.itemId });
      setNoteText("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteNote = trpc.meetingNotes.delete.useMutation({
    onSuccess: () => utils.meetingNotes.list.invalidate({ itemId: params.itemId }),
    onError: (e) => toast.error(e.message),
  });

  const getUserById = (id: string | null | undefined) => appUsers.find((u) => u.id === id);
  const getProjectById = (id: string | null | undefined) => projects.find((p) => p.id === id);

  const handleSendComment = () => {
    if (!commentText.trim() || !currentUserData) return;
    createComment.mutate({
      itemId: params.itemId,
      authorId: currentUserData.id,
      authorName: currentUserData.name,
      content: commentText.trim(),
    });
  };

  const handleSendNote = () => {
    if (!noteText.trim() || !currentUserData) return;
    createNote.mutate({
      itemId: params.itemId,
      authorId: currentUserData.id,
      authorName: currentUserData.name,
      content: noteText.trim(),
    });
  };

  const formatDateTime = (dateStr?: string | null, timeStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString("th-TH", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
      return timeStr ? `${datePart} ${timeStr}` : datePart;
    } catch { return dateStr; }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">ไม่พบรายการนี้</p>
        <Button variant="outline" onClick={() => navigate(-1 as unknown as string)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  const project = getProjectById(item.projectId);
  const responsible = getUserById(item.responsibleId);
  const assignees = Array.isArray(item.assigneeIds) ? item.assigneeIds : [];
  const isMeeting = item.type === "meeting";
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = item.dueDate && item.dueDate < today && item.status !== "done" && item.status !== "cancelled";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isMeeting ? "/ae/meetings" : "/ae/tasks")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isMeeting ? "การประชุม" : "งาน"}
        </Button>
        <div className="flex-1" />
        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[item.status])}>
          {STATUS_LABELS[item.status]}
        </Badge>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Type */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isMeeting ? (
                <Video className="w-5 h-5 text-blue-500" />
              ) : (
                <CheckSquare className="w-5 h-5 text-green-500" />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isMeeting ? "การประชุม" : "งาน"}
              </span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">เกินกำหนด</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
            {item.description && (
              <p className="text-muted-foreground mt-2 leading-relaxed">{item.description}</p>
            )}
          </div>

          {/* Status & Priority controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">สถานะ:</span>
              <Select
                value={item.status}
                onValueChange={(v) => updateItem.mutate({ id: item.id, status: v as typeof item.status })}
              >
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [typeof item.status, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">ความสำคัญ:</span>
              <Select
                value={item.priority}
                onValueChange={(v) => updateItem.mutate({ id: item.id, priority: v as typeof item.priority })}
              >
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITY_LABELS) as [typeof item.priority, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Meeting Notes (for meetings) */}
          {isMeeting && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                บันทึกการประชุม
              </h2>
              <div className="space-y-3 mb-4">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">ยังไม่มีบันทึกการประชุม</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-700 mb-1">{note.authorName}</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {note.createdAt ? new Date(note.createdAt).toLocaleString("th-TH") : ""}
                          </p>
                        </div>
                        {currentUserData?.id === note.authorId && (
                          <button
                            onClick={() => deleteNote.mutate({ id: note.id })}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="เพิ่มบันทึกการประชุม..."
                  className="text-sm resize-none"
                  rows={2}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSendNote(); }}
                />
                <Button
                  size="sm"
                  onClick={handleSendNote}
                  disabled={!noteText.trim() || createNote.isPending}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              ความคิดเห็น ({comments.length})
            </h2>
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">ยังไม่มีความคิดเห็น</p>
              ) : (
                comments.map((comment) => {
                  const author = getUserById(comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                        author?.avatarColor || "bg-gray-400"
                      )}>
                        {author?.avatarInitials?.slice(0, 1) || comment.authorName.slice(0, 1)}
                      </div>
                      <div className="flex-1 bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">{comment.authorName}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-muted-foreground">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleString("th-TH") : ""}
                            </p>
                            {currentUserData?.id === comment.authorId && (
                              <button
                                onClick={() => deleteComment.mutate({ id: comment.id })}
                                className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="เพิ่มความคิดเห็น..."
                className="text-sm resize-none"
                rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSendComment(); }}
              />
              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={!commentText.trim() || createComment.isPending}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">รายละเอียด</h3>

            {/* Project */}
            {project && (
              <div className="flex items-start gap-2">
                <Folder className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">โปรเจค</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", project.color || "bg-blue-500")} />
                    <p className="text-sm font-medium">{project.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            {(item.dueDate || item.endDate) && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{isMeeting ? "วันที่ประชุม" : "กำหนดส่ง"}</p>
                  <p className={cn("text-sm font-medium mt-0.5", isOverdue && "text-red-500")}>
                    {formatDateTime(item.dueDate, item.dueTime)}
                    {item.endDate && item.endDate !== item.dueDate && (
                      <span className="text-muted-foreground"> → {formatDateTime(item.endDate, item.endTime)}</span>
                    )}
                    {item.dueDate === item.endDate && item.endTime && (
                      <span className="text-muted-foreground"> – {item.endTime}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Location (meetings) */}
            {isMeeting && item.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">สถานที่</p>
                  <p className="text-sm font-medium mt-0.5">{item.location}</p>
                </div>
              </div>
            )}

            {/* Responsible */}
            {responsible && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">ผู้รับผิดชอบ</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                      responsible.avatarColor || "bg-blue-500"
                    )}>
                      {responsible.avatarInitials?.slice(0, 1) || responsible.name.slice(0, 1)}
                    </div>
                    <p className="text-sm font-medium">{responsible.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Assignees */}
            {assignees.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{isMeeting ? "ผู้เข้าร่วม" : "ผู้ดำเนินงาน"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {assignees.map((aid) => {
                      const u = getUserById(aid);
                      if (!u) return null;
                      return (
                        <div key={aid} className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold",
                            u.avatarColor || "bg-blue-500"
                          )}>
                            {u.avatarInitials?.slice(0, 1) || u.name.slice(0, 1)}
                          </div>
                          <span className="text-xs">{u.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Priority */}
            <div className="flex items-start gap-2">
              <Flag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">ความสำคัญ</p>
                <Badge variant="secondary" className={cn("text-xs mt-0.5", PRIORITY_COLORS[item.priority])}>
                  {PRIORITY_LABELS[item.priority]}
                </Badge>
              </div>
            </div>

            {/* Timestamps */}
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                สร้างเมื่อ: {item.createdAt ? new Date(item.createdAt).toLocaleString("th-TH") : "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                อัพเดทล่าสุด: {item.updatedAt ? new Date(item.updatedAt).toLocaleString("th-TH") : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
