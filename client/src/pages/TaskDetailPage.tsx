/**
 * Task Detail Page — Shared across Task Management, Customer CRM, and Cash Collection
 * AE View: Shows Work Items, Internal Tasks, Cash Collection, full brief
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, Plus, CheckCircle2, Circle, Upload, FileText,
  Calendar, User, Building2, DollarSign, Zap, Edit3,
  Paperclip, AlertCircle, Clock, ChevronDown, ChevronUp,
  Briefcase, ClipboardList, CreditCard, ExternalLink, X,
  MessageSquare, Send, Trash2, FilePlus, Link2, FolderOpen, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PaymentBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  db, Task, WorkItem, InternalTask, TaskStatus, PaymentStatus,
  FinancialDocType, FinancialDocument, ActivityLog,
  formatCurrency, getTaskProgress, getPaymentStatusLabel, getStatusLabel
} from "@/lib/database";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/ae/task/:taskId");
  const taskId = params?.taskId || "";
  const { tasks, customers } = useDatabase();

  const task = tasks.find((t) => t.id === taskId);
  const customer = task ? customers.find((c) => c.id === task.customerId) : null;

  // Comment state
  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    db.addComment(taskId, "ae_current", "AE", text);
    setCommentText("");
    toast.success("เพิ่ม Comment แล้ว");
  };

  const handleDeleteComment = (commentId: string) => {
    db.deleteComment(taskId, commentId);
  };

  // Modals
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [showCompleteWork, setShowCompleteWork] = useState<WorkItem | null>(null);
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  // Confirm complete task dialog
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  // Confirm revert to TODO dialog
  const [showConfirmRevert, setShowConfirmRevert] = useState(false);

  // Forms
  const [workForm, setWorkForm] = useState({ title: "", description: "", dueDate: "" });
  const [internalForm, setInternalForm] = useState("");
  const [evidenceForm, setEvidenceForm] = useState({ files: "", note: "" });
  const [paymentForm, setPaymentForm] = useState({
    status: "unpaid" as PaymentStatus,
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    paidDate: "",
    note: "",
  });
  const [docForm, setDocForm] = useState({
    docType: "QT" as FinancialDocType,
    otherLabel: "",
    docDate: "",
    fileUrl: "",
    fileName: "",
    note: "",
  });

  const handleAddDocument = () => {
    // docDate is now optional — no longer required
    if (docForm.docType === "other" && !docForm.otherLabel.trim()) { toast.error("กรุณาระบุชื่อเอกสาร"); return; }
    db.addFinancialDocument(taskId, {
      docType: docForm.docType,
      otherLabel: docForm.docType === "other" ? docForm.otherLabel : undefined,
      docDate: docForm.docDate || undefined,
      fileUrl: docForm.fileUrl || undefined,
      fileName: docForm.fileName || undefined,
      note: docForm.note || undefined,
    });
    setDocForm({ docType: "QT", otherLabel: "", docDate: "", fileUrl: "", fileName: "", note: "" });
    setShowAddDocument(false);
    toast.success("เพิ่มเอกสารแล้ว");
  };

  const handleDeleteDocument = (docId: string) => {
    db.deleteFinancialDocument(taskId, docId);
    toast.success("ลบเอกสารแล้ว");
  };

  useEffect(() => {
    if (task?.cashCollection) {
      setPaymentForm({
        status: task.cashCollection.status,
        invoiceNumber: task.cashCollection.invoiceNumber || "",
        invoiceDate: task.cashCollection.invoiceDate || "",
        dueDate: task.cashCollection.dueDate || "",
        paidDate: task.cashCollection.paidDate || "",
        note: task.cashCollection.note || "",
      });
    }
  }, [task?.cashCollection.status]);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">ไม่พบ Task นี้</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/ae")}>
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  const progress = getTaskProgress(task);
  const workDone = task.workItems.filter((w) => w.status === "done").length;

  const handleAddWork = () => {
    if (!workForm.title || !workForm.dueDate) {
      toast.error("กรุณากรอกชื่องานและวันครบกำหนด");
      return;
    }
    db.addWorkItem(taskId, workForm);
    setWorkForm({ title: "", description: "", dueDate: "" });
    setShowAddWork(false);
    toast.success("เพิ่ม Work Item เรียบร้อยแล้ว");
  };

  const handleAddInternal = () => {
    if (!internalForm.trim()) return;
    db.addInternalTask(taskId, internalForm.trim());
    setInternalForm("");
    setShowAddInternal(false);
    toast.success("เพิ่ม Internal Task เรียบร้อยแล้ว");
  };

  const handleCompleteWork = () => {
    if (!showCompleteWork) return;
    const files = evidenceForm.files
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    if (files.length === 0 && !evidenceForm.note) {
      toast.error("กรุณาแนบหลักฐานหรือใส่หมายเหตุ");
      return;
    }
    db.completeWorkItem(taskId, showCompleteWork.id, files, evidenceForm.note);
    setShowCompleteWork(null);
    setEvidenceForm({ files: "", note: "" });
    toast.success("ทำเครื่องหมายงานเสร็จสิ้นแล้ว");
  };

  const handleUpdatePayment = () => {
    db.updatePaymentStatus(taskId, paymentForm.status, {
      invoiceNumber: paymentForm.invoiceNumber || undefined,
      invoiceDate: paymentForm.invoiceDate || undefined,
      dueDate: paymentForm.dueDate || undefined,
      paidDate: paymentForm.paidDate || undefined,
      note: paymentForm.note || undefined,
    });
    setShowUpdatePayment(false);
    toast.success("อัปเดตสถานะการชำระเงินแล้ว");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/ae")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-sm">{customer?.company}</span>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="font-semibold text-foreground truncate">{task.title}</span>
          </div>
        </div>
        {/* Clickable status changer in header */}
        <TaskStatusChanger
          status={task.status}
          onRequestComplete={() => setShowConfirmComplete(true)}
          onRequestRevert={() => setShowConfirmRevert(true)}
          onChangeStatus={(s: TaskStatus) => db.setTaskStatus(taskId, s)}
        />
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Task Header Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0", customer?.avatarColor || "bg-slate-400")}>
                {customer?.avatarInitials || "??"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground mb-1">{task.title}</h1>
                <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {customer?.brandName || customer?.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    ผู้ติดต่อ: {task.contactName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    AE: {task.aeName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {task.createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            {task.workItems.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">ความคืบหน้างาน (Work Items)</span>
                  <span className="text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {workDone} จาก {task.workItems.length} งานเสร็จสิ้น
                </p>
              </div>
            )}
          </div>

          {/* Brief */}
          {task.brief && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Brief งาน</p>
                <p className="text-sm text-foreground leading-relaxed">{task.brief}</p>
              </div>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Work Items + Internal Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Items Section */}
            <Section
              icon={Briefcase}
              title="Work Items"
              subtitle="งานที่ต้อง Commit ส่งลูกค้า (ต้องมีหลักฐาน)"
              accentColor="blue"
              action={
                <Button size="sm" onClick={() => setShowAddWork(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                  <Plus className="w-3.5 h-3.5" /> เพิ่ม Work
                </Button>
              }
            >
              {task.workItems.length === 0 ? (
                <EmptyState icon={Briefcase} text="ยังไม่มี Work Items" sub="กด 'เพิ่ม Work' เพื่อเพิ่มงานที่ต้องส่งลูกค้า" />
              ) : (
                <div className="space-y-3">
                  {task.workItems.map((item) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      onComplete={() => {
                        setShowCompleteWork(item);
                        setEvidenceForm({ files: "", note: "" });
                      }}
                      onStatusChange={(status) => db.updateWorkItemStatus(taskId, item.id, status)}
                      onDelete={() => { db.deleteWorkItem(taskId, item.id); toast.success("ลบ Work Item แล้ว"); }}
                      onEdit={(data) => { db.editWorkItem(taskId, item.id, data); toast.success("แก้ไขแล้ว"); }}
                      onRevert={() => { db.updateWorkItemStatus(taskId, item.id, "pending"); toast.success("คืนเป็น To Do แล้ว"); }}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* Internal Tasks Section */}
            <Section
              icon={ClipboardList}
              title="Internal Tasks"
              subtitle="งานภายใน Remind ตัวเอง (ไม่ต้องมีหลักฐาน)"
              accentColor="purple"
              action={
                <Button size="sm" variant="outline" onClick={() => setShowAddInternal(true)} className="gap-1.5 h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Plus className="w-3.5 h-3.5" /> เพิ่ม Task
                </Button>
              }
            >
              {task.internalTasks.length === 0 ? (
                <EmptyState icon={ClipboardList} text="ยังไม่มี Internal Tasks" sub="กด 'เพิ่ม Task' เพื่อเพิ่ม Reminder ภายใน" />
              ) : (
                <div className="space-y-2">
                  {task.internalTasks.map((item) => (
                    <InternalTaskItem
                      key={item.id}
                      item={item}
                      onToggle={() => db.toggleInternalTask(taskId, item.id)}
                      onDelete={() => { db.deleteInternalTask(taskId, item.id); toast.success("ลบ Task แล้ว"); }}
                      onEdit={(newTitle) => { db.editInternalTask(taskId, item.id, newTitle); toast.success("แก้ไขแล้ว"); }}
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Right: Cash Collection + Comments */}
          <div className="space-y-4">
            {/* Cash Collection — Payment Status */}
            <Section
              icon={CreditCard}
              title="Cash Collection"
              subtitle="สถานะการเก็บเงิน"
              accentColor="green"
              action={
                <Button size="sm" variant="outline" onClick={() => setShowUpdatePayment(true)} className="gap-1.5 h-8 text-xs">
                  <Edit3 className="w-3.5 h-3.5" /> แก้ไขสถานะ
                </Button>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-extrabold text-foreground">{formatCurrency(task.cashCollection.amount)}</p>
                  <PaymentBadge status={task.cashCollection.status} />
                </div>
                <div className="space-y-2 text-sm">
                  {task.cashCollection.invoiceNumber && (
                    <InfoRow label="Invoice No." value={task.cashCollection.invoiceNumber} icon={FileText} />
                  )}
                  {task.cashCollection.dueDate && (
                    <InfoRow label="ครบกำหนด" value={task.cashCollection.dueDate} icon={Clock} />
                  )}
                  {task.cashCollection.paidDate && (
                    <InfoRow label="วันที่ชำระ" value={task.cashCollection.paidDate} icon={CheckCircle2} />
                  )}
                </div>
                {task.cashCollection.note && (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    {task.cashCollection.note}
                  </div>
                )}
              </div>
            </Section>

            {/* Financial Documents */}
            <Section
              icon={FolderOpen}
              title="เอกสารทางการเงิน"
              subtitle={`${task.cashCollection.documents?.length || 0} ไฟล์`}
              accentColor="orange"
              action={
                <Button size="sm" onClick={() => setShowAddDocument(true)} className="gap-1.5 h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                  <FilePlus className="w-3.5 h-3.5" /> เพิ่มเอกสาร
                </Button>
              }
            >
              {(!task.cashCollection.documents || task.cashCollection.documents.length === 0) ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">ยังไม่มีเอกสาร</p>
                  <p className="text-xs opacity-70">กด 'เพิ่มเอกสาร' เพื่อแนบไฟล์หรือลิงก์</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {task.cashCollection.documents.map((doc) => (
                    <FinancialDocCard key={doc.id} doc={doc} onDelete={() => handleDeleteDocument(doc.id)} />
                  ))}
                </div>
              )}
            </Section>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">หมายเหตุ / Notes</p>
                  <p className="text-xs text-muted-foreground">บันทึกรายละเอียดหรือสิ่งที่ต้องการ Note</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Comment List */}
                {task.comments && task.comments.length > 0 ? (
                  <div className="space-y-2.5 mb-3">
                    {task.comments.map((c) => (
                      <div key={c.id} className="group bg-amber-50/60 rounded-xl border border-amber-100 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground leading-relaxed flex-1">{c.content}</p>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 flex-shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{c.authorName} · {c.createdAt}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">ยังไม่มีหมายเหตุ</p>
                )}

                {/* Add Comment */}
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="พิมพ์หมายเหตุ... (Enter เพื่อส่ง)"
                    rows={2}
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="flex-shrink-0 w-9 h-9 self-end rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/* Activity Log Section */}
        <ActivityLogSection logs={task.activityLog || []} />
      </div>
    </div>

      {/* Add Work Modal */}
      <Dialog open={showAddWork} onOpenChange={setShowAddWork}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม Work Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่องาน <span className="text-red-500">*</span></Label>
              <Input placeholder="เช่น ลง Post Facebook 4 ชิ้น" value={workForm.title} onChange={(e) => setWorkForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รายละเอียด</Label>
              <Textarea placeholder="รายละเอียดงาน..." value={workForm.description} onChange={(e) => setWorkForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>วันครบกำหนด <span className="text-red-500">*</span></Label>
              <Input type="date" value={workForm.dueDate} onChange={(e) => setWorkForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWork(false)}>ยกเลิก</Button>
            <Button onClick={handleAddWork} className="bg-blue-600 hover:bg-blue-700">เพิ่ม Work Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Internal Task Modal */}
      <Dialog open={showAddInternal} onOpenChange={setShowAddInternal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่ม Internal Task</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="เช่น ตามบรีฟลูกค้า, ไปถ่ายงาน..."
              value={internalForm}
              onChange={(e) => setInternalForm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddInternal()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInternal(false)}>ยกเลิก</Button>
            <Button onClick={handleAddInternal} className="bg-purple-600 hover:bg-purple-700">เพิ่ม Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Work Modal (requires evidence) */}
      <Dialog open={!!showCompleteWork} onOpenChange={() => setShowCompleteWork(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              ส่งงานเสร็จสิ้น
            </DialogTitle>
          </DialogHeader>
          {showCompleteWork && (
            <div className="space-y-4 py-2">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-700">{showCompleteWork.title}</p>
                {showCompleteWork.description && (
                  <p className="text-blue-600 mt-1 text-xs">{showCompleteWork.description}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  ชื่อไฟล์หลักฐาน (คั่นด้วย comma)
                </Label>
                <Input
                  placeholder="เช่น post_fb_1.jpg, report.pdf"
                  value={evidenceForm.files}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, files: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">ใส่ชื่อไฟล์หรือ URL หลักฐาน</p>
              </div>
              <div className="space-y-1.5">
                <Label>หมายเหตุ / สรุปผลงาน</Label>
                <Textarea
                  placeholder="สรุปผลงาน เช่น โพสต์ครบ 4 ชิ้น ยอด Reach เฉลี่ย 60,000..."
                  value={evidenceForm.note}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, note: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteWork(null)}>ยกเลิก</Button>
            <Button onClick={handleCompleteWork} className="bg-green-600 hover:bg-green-700 gap-2">
              <CheckCircle2 className="w-4 h-4" />
              ยืนยันงานเสร็จสิ้น
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Financial Document Modal */}
      <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มเอกสารทางการเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ประเภทเอกสาร <span className="text-red-500">*</span></Label>
              <Select value={docForm.docType} onValueChange={(v) => setDocForm((f) => ({ ...f, docType: v as FinancialDocType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QT">ใบเสนอราคา (QT)</SelectItem>
                  <SelectItem value="BL">ใบวางบิล (BL)</SelectItem>
                  <SelectItem value="INV">ใบแจ้งหนี้ / Invoice (INV)</SelectItem>
                  <SelectItem value="PO">ใบสั่งซื้อ (PO)</SelectItem>
                  <SelectItem value="other">เอกสารอื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {docForm.docType === "other" && (
              <div className="space-y-1.5">
                <Label>ชื่อเอกสาร <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="ระบุชื่อเอกสาร..."
                  value={docForm.otherLabel}
                  onChange={(e) => setDocForm((f) => ({ ...f, otherLabel: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>วันที่เอกสาร <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={docForm.docDate}
                onChange={(e) => setDocForm((f) => ({ ...f, docDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อไฟล์ (Optional)</Label>
              <Input
                placeholder="เช่น INV-2025-001.pdf"
                value={docForm.fileName}
                onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />ลิงก์ไฟล์ / URL (Optional)</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={docForm.fileUrl}
                onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ (Optional)</Label>
              <Textarea
                placeholder="หมายเหตุเพิ่มเติม..."
                value={docForm.note}
                onChange={(e) => setDocForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocument(false)}>ยกเลิก</Button>
            <Button onClick={handleAddDocument} className="bg-orange-500 hover:bg-orange-600 gap-2">
              <FilePlus className="w-4 h-4" />
              เพิ่มเอกสาร
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Complete Task Dialog */}
      <Dialog open={showConfirmComplete} onOpenChange={setShowConfirmComplete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              ยืนยันปิดงาน
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-foreground">คุณต้องการเปลี่ยนสถานะงาน <span className="font-semibold">"{task.title}"</span> เป็น <span className="text-green-600 font-semibold">เสร็จสิ้น</span> ใช่หรือไม่?</p>
            {(task.cashCollection.documents?.length || 0) === 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">ยังไม่มีเอกสารทางการเงิน ควรแนบ Invoice ก่อนปิดงาน</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmComplete(false)}>ยกเลิก</Button>
            <Button
              onClick={() => {
                db.setTaskStatus(taskId, "done");
                setShowConfirmComplete(false);
                toast.success("ปิดงานเรียบร้อยแล้ว");
              }}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              ยืนยันปิดงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Revert to TODO Dialog */}
      <Dialog open={showConfirmRevert} onOpenChange={setShowConfirmRevert}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              ย้อนกลับเป็น To Do
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground">คุณต้องการเปลี่ยนสถานะงาน <span className="font-semibold">"{task.title}"</span> กลับเป็น <span className="text-orange-600 font-semibold">รอดำเนินการ</span> ใช่หรือไม่?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmRevert(false)}>ยกเลิก</Button>
            <Button
              onClick={() => {
                db.setTaskStatus(taskId, "pending");
                setShowConfirmRevert(false);
                toast.success("ย้อนกลับสถานะเรียบร้อยแล้ว");
              }}
              className="bg-orange-500 hover:bg-orange-600 gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              ย้อนกลับเป็น To Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Payment Modal */}
      <Dialog open={showUpdatePayment} onOpenChange={setShowUpdatePayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm((f) => ({ ...f, status: v as PaymentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">ยังไม่เก็บเงิน</SelectItem>
                  <SelectItem value="invoiced">ส่ง Invoice แล้ว</SelectItem>
                  <SelectItem value="partial">ชำระบางส่วน</SelectItem>
                  <SelectItem value="paid">ชำระครบแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Invoice Number</Label>
                <Input placeholder="INV-2025-XXX" value={paymentForm.invoiceNumber} onChange={(e) => setPaymentForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>วันที่ Invoice</Label>
                <Input type="date" value={paymentForm.invoiceDate} onChange={(e) => setPaymentForm((f) => ({ ...f, invoiceDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>วันครบกำหนด</Label>
                <Input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>วันที่ชำระ</Label>
                <Input type="date" value={paymentForm.paidDate} onChange={(e) => setPaymentForm((f) => ({ ...f, paidDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea placeholder="หมายเหตุเพิ่มเติม..." value={paymentForm.note} onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdatePayment(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdatePayment} className="bg-green-600 hover:bg-green-700">บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function Section({
  icon: Icon, title, subtitle, accentColor, action, children
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentColor: "blue" | "purple" | "green" | "orange";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
  };
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[accentColor])}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function WorkItemCard({
  item, onComplete, onStatusChange, onDelete, onEdit, onRevert
}: {
  item: WorkItem;
  onComplete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
  onEdit: (data: { title: string; description: string; dueDate: string }) => void;
  onRevert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: item.title, description: item.description || "", dueDate: item.dueDate });
  const isDone = item.status === "done";

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isDone ? "bg-green-50/50 border-green-200" : "bg-white border-border hover:border-blue-200"
    )}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => !isDone && onComplete()}
          className={cn(
            "mt-0.5 flex-shrink-0 transition-colors",
            isDone ? "text-green-500 cursor-default" : "text-muted-foreground hover:text-green-500"
          )}
        >
          {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-medium text-sm", isDone && "line-through text-muted-foreground")}>
              {item.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isDone && (
                <Select value={item.status} onValueChange={(v) => onStatusChange(v as TaskStatus)}>
                  <SelectTrigger className="h-7 text-xs w-36 border-0 bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="in_progress">กำลังทำ</SelectItem>
                    <SelectItem value="review">รอ Review</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {isDone && <StatusBadge status="done" />}
            </div>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              ครบกำหนด {item.dueDate}
            </span>
            {item.completedAt && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                เสร็จ {item.completedAt}
              </span>
            )}
          </div>

          {/* Evidence */}
          {isDone && (item.evidence?.length || item.evidenceNote) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline"
            >
              <Paperclip className="w-3 h-3" />
              ดูหลักฐาน
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          {expanded && isDone && (
            <div className="mt-2 bg-white rounded-lg border border-green-200 p-3 space-y-2">
              {item.evidence && item.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ไฟล์หลักฐาน:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.evidence.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-100">
                        <Paperclip className="w-3 h-3" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.evidenceNote && (
                <p className="text-xs text-muted-foreground">{item.evidenceNote}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {!isDone && (
              <Button
                size="sm"
                onClick={onComplete}
                className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                ส่งงานเสร็จสิ้น
              </Button>
            )}
            {isDone && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRevert}
                className="h-7 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                คืนเป็น To Do
              </Button>
            )}
            {!isDone && (
              <button
                onClick={() => { setEditForm({ title: item.title, description: item.description || "", dueDate: item.dueDate }); setEditing(true); }}
                className="h-7 px-2 text-xs rounded-md border border-border text-muted-foreground hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> แก้ไข
              </button>
            )}
            <button
              onClick={onDelete}
              className="h-7 px-2 text-xs rounded-md border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1 ml-auto"
            >
              <Trash2 className="w-3 h-3" /> ลบ
            </button>
          </div>
        </div>
      </div>

      {/* Edit Work Item Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-4">แก้ไข Work Item</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ชื่องาน *</label>
                <input
                  autoFocus
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">รายละเอียด</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">วันครบกำหนด *</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">ยกเลิก</button>
              <button
                onClick={() => { if (editForm.title && editForm.dueDate) { onEdit(editForm); setEditing(false); } }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InternalTaskItem({
  item, onToggle, onDelete, onEdit
}: {
  item: InternalTask;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(item.title);

  const handleSave = () => {
    if (editVal.trim()) { onEdit(editVal.trim()); }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border border-purple-300 bg-purple-50">
        <input
          autoFocus
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 text-sm bg-transparent outline-none border-none text-foreground"
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1">
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
        item.done
          ? "bg-purple-50/50 border-purple-100 opacity-70"
          : "bg-white border-border hover:border-purple-200"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.done ? "bg-purple-500 border-purple-500" : "border-muted-foreground hover:border-purple-400"
        )}
      >
        {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>
      <span className={cn("text-sm flex-1", item.done && "line-through text-muted-foreground")}>
        {item.title}
      </span>
      {item.completedAt && (
        <span className="text-xs text-muted-foreground flex-shrink-0">{item.completedAt}</span>
      )}
      {/* Edit/Delete actions — show on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => { setEditVal(item.title); setEditing(true); }}
          title="แก้ไข"
          className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="ลบ"
          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }: { icon: React.ElementType; text: string; sub: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto mb-2 opacity-20" />
      <p className="text-sm font-medium">{text}</p>
      <p className="text-xs mt-1">{sub}</p>
    </div>
  );
}

const DOC_TYPE_COLORS: Record<string, string> = {
  QT: "bg-amber-50 text-amber-700 border-amber-200",
  BL: "bg-blue-50 text-blue-700 border-blue-200",
  INV: "bg-green-50 text-green-700 border-green-200",
  PO: "bg-violet-50 text-violet-700 border-violet-200",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  QT: FileText,
  BL: FileText,
  INV: FileText,
  PO: FileText,
  other: FileText,
};

function FinancialDocCard({ doc, onDelete }: { doc: FinancialDocument; onDelete: () => void }) {
  const label = doc.docType === "other" ? (doc.otherLabel || "เอกสารอื่นๆ") : doc.docType;
  const colorClass = DOC_TYPE_COLORS[doc.docType] || DOC_TYPE_COLORS.other;
  const DocIcon = DOC_TYPE_ICONS[doc.docType] || FileText;
  const hasLink = doc.fileUrl && doc.fileUrl !== "#";
  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-white hover:border-orange-200 transition-all">
      {/* Doc type badge with icon */}
      <div className={cn("flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border min-w-[48px]", colorClass)}>
        <DocIcon className="w-4 h-4" />
        <span className="text-[10px] font-bold leading-none">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {doc.fileName ? (
              <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">ไม่มีชื่อไฟล์</p>
            )}
            {doc.docDate && (
              <p className="text-xs text-muted-foreground mt-0.5">วันที่: {doc.docDate}</p>
            )}
            {doc.note && <p className="text-xs text-muted-foreground mt-0.5">{doc.note}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasLink && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดเอกสาร"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                เปิด
              </a>
            )}
            <button
              onClick={onDelete}
              title="ลบเอกสาร"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Log ───────────────────────────────────────────────

const ACTIVITY_LOG_ICONS: Record<string, React.ElementType> = {
  task_created: Plus,
  status_change: RotateCcw,
  work_item_added: Briefcase,
  work_item_done: CheckCircle2,
  work_item_deleted: Trash2,
  internal_task_added: ClipboardList,
  document_added: FilePlus,
  payment_updated: CreditCard,
  comment_added: MessageSquare,
};

const ACTIVITY_LOG_COLORS: Record<string, string> = {
  task_created: "bg-blue-50 text-blue-600",
  status_change: "bg-amber-50 text-amber-600",
  work_item_added: "bg-indigo-50 text-indigo-600",
  work_item_done: "bg-green-50 text-green-600",
  work_item_deleted: "bg-red-50 text-red-500",
  internal_task_added: "bg-purple-50 text-purple-600",
  document_added: "bg-orange-50 text-orange-600",
  payment_updated: "bg-emerald-50 text-emerald-600",
  comment_added: "bg-amber-50 text-amber-600",
};

function ActivityLogSection({ logs }: { logs: ActivityLog[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = expanded ? sorted : sorted.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Activity Log</p>
            <p className="text-xs text-muted-foreground">ประวัติการเปลี่ยนแปลงทั้งหมด {logs.length} รายการ</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">ยังไม่มีประวัติการ</p>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {visible.map((log, i) => {
                  const Icon = ACTIVITY_LOG_ICONS[log.type] || Clock;
                  const colorClass = ACTIVITY_LOG_COLORS[log.type] || "bg-slate-50 text-slate-600";
                  const dateStr = log.createdAt.includes("T")
                    ? new Date(log.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : log.createdAt;
                  return (
                    <div key={log.id} className="flex items-start gap-4 relative">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white", colorClass)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm text-foreground leading-snug">{log.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.authorName} · {dateStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {sorted.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> ย่อสรุป</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> ดูทั้งหมด ({sorted.length} รายการ)</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "pending", label: "รอดำเนินการ", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "in_progress", label: "กำลังดำเนินการ", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "review", label: "รอตรวจสอบ", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "done", label: "เสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-200" },
];

function TaskStatusChanger({
  status,
  onRequestComplete,
  onRequestRevert,
  onChangeStatus,
}: {
  status: TaskStatus;
  onRequestComplete: () => void;
  onRequestRevert: () => void;
  onChangeStatus: (s: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
          current.color
        )}
      >
        {current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
            {STATUS_OPTIONS.filter((o) => o.value !== "cancelled").map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setOpen(false);
                  if (opt.value === "done") { onRequestComplete(); return; }
                  if (status === "done" && opt.value === "pending") { onRequestRevert(); return; }
                  onChangeStatus(opt.value);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2",
                  status === opt.value && "font-semibold"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", opt.color.split(" ")[0])} />
                {opt.label}
                {status === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
