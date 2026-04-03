/**
 * Customer Portal — Customer-facing view
 * Design: Clean, professional, customer-friendly
 * Layout: Sidebar with tabs (left) + Content (right)
 * Shows ONLY: Work Items (with evidence), Brief, Financial Documents, Contact Info
 * HIDES: Internal Tasks, AE notes, internal process details
 */
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, CheckCircle2, Clock, FileText, Paperclip,
  Calendar, Zap, ChevronRight, ChevronDown, ChevronUp,
  Briefcase, DollarSign, AlertCircle, ExternalLink,
  LogOut, LayoutGrid, Bell, HelpCircle, User, Phone, Mail,
  FileCheck, Receipt, FileBadge, FileBox, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Task, Customer, formatCurrency, getTaskProgress, getCustomerTypeColor, clearSession } from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Document type config ─────────────────────────────────────────
const DOC_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  QT:    { label: "ใบเสนอราคา (QT)",   icon: FileText,   color: "text-amber-600 bg-amber-50 border-amber-200" },
  BL:    { label: "ใบวางบิล (BL)",      icon: Receipt,    color: "text-blue-600 bg-blue-50 border-blue-200" },
  INV:   { label: "ใบแจ้งหนี้ (INV)",   icon: FileCheck,  color: "text-green-600 bg-green-50 border-green-200" },
  PO:    { label: "ใบสั่งซื้อ (PO)",    icon: FileBadge,  color: "text-violet-600 bg-violet-50 border-violet-200" },
  other: { label: "เอกสารอื่นๆ",        icon: FileBox,    color: "text-slate-600 bg-slate-50 border-slate-200" },
};

// ─── Sidebar Nav Items ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "works",        label: "งานของฉัน",     icon: LayoutGrid,  active: true },
  { id: "notifications",label: "การแจ้งเตือน",  icon: Bell,        active: false },
  { id: "help",         label: "ติดต่อสอบถาม",  icon: HelpCircle,  active: false },
];

export default function CustomerPortal() {
  const [location, navigate] = useLocation();
  const [, params] = useRoute("/customer/:customerId");
  const [, taskParams] = useRoute("/customer/:customerId/task/:taskId");

  const customerId = params?.customerId || taskParams?.customerId || "";
  const taskId = taskParams?.taskId || "";
  const [activeTab, setActiveTab] = useState("works");

  const { customers, tasks } = useDatabase();
  const customer = customers.find((c) => c.id === customerId);
  const customerTasks = tasks.filter((t) => t.customerId === customerId && t.status !== "cancelled");

  const handleLogout = () => {
    clearSession();
    navigate("/");
    toast.success("ออกจากระบบแล้ว");
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">ไม่พบข้อมูลลูกค้า</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  // If taskId is set, show task detail view
  if (taskId) {
    const task = tasks.find((t) => t.id === taskId && t.customerId === customerId);
    if (!task) return null;
    return (
      <PortalShell customer={customer} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
        <CustomerTaskDetail task={task} customer={customer} onBack={() => navigate(`/customer/${customerId}`)} />
      </PortalShell>
    );
  }

  return (
    <PortalShell customer={customer} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      <div className="p-5 sm:p-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-1">
            สวัสดีครับ 👋
          </h1>
          <p className="text-muted-foreground text-sm">นี่คือสรุปงานทั้งหมดที่เราดูแลให้คุณอยู่</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-border p-3 sm:p-4 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-foreground">{customerTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">งานทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 sm:p-4 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {customerTasks.filter((t) => t.status === "in_progress" || t.status === "review").length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">กำลังดำเนินการ</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 sm:p-4 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {customerTasks.filter((t) => t.status === "done").length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">เสร็จสิ้น</p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h2 className="font-bold text-foreground">งานที่จ้างทั้งหมด</h2>
          {customerTasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ยังไม่มีงาน</p>
            </div>
          ) : (
            customerTasks.map((task) => (
              <CustomerTaskCard
                key={task.id}
                task={task}
                onClick={() => navigate(`/customer/${customerId}/task/${task.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
}

// ─── Portal Shell with Sidebar ────────────────────────────────────
function PortalShell({
  customer, activeTab, onTabChange, onLogout, children
}: {
  customer: Customer;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-border flex flex-col z-30 transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:flex",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">MediaFlow</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{customer.name}</p>
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium", getCustomerTypeColor(customer.type))}>
                {customer.type}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.active) {
                    toast.info("Feature coming soon");
                    return;
                  }
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive && item.active
                    ? "bg-blue-50 text-blue-700"
                    : item.active
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {!item.active && (
                  <span className="ml-auto text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">เร็วๆ นี้</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
            <span className="font-semibold text-sm">{customer.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">MediaFlow</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────
function CustomerTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const progress = getTaskProgress(task);
  const workDone = task.workItems.filter((w) => w.status === "done").length;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5 text-left group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{task.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">เริ่มต้น {task.createdAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={task.status} />
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
        </div>
      </div>

      {/* Contact Info */}
      {task.contactName && (
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="w-3 h-3" />
            ผู้ติดต่อ: <span className="font-medium text-foreground">{task.contactName}</span>
          </span>
          {task.contactPhone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              {task.contactPhone}
            </span>
          )}
        </div>
      )}

      {task.workItems.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">ความคืบหน้า</span>
            <span className="text-xs font-semibold text-blue-600">{workDone}/{task.workItems.length} งาน</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <PaymentBadge status={task.cashCollection.status} />
        <span className="font-bold text-foreground text-sm">{formatCurrency(task.cashCollection.amount)}</span>
      </div>
    </button>
  );
}

// ─── Task Detail ───────────────────────────────────────────────────
function CustomerTaskDetail({
  task, customer, onBack
}: {
  task: Task;
  customer: Customer;
  onBack: () => void;
}) {
  const [expandedWork, setExpandedWork] = useState<string | null>(null);

  const visibleWorkItems = task.workItems;
  const financialDocs = task.cashCollection.documents || [];

  return (
    <div className="p-5 sm:p-8 space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับรายการงาน
      </button>

      {/* Task Header */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0", customer.avatarColor)}>
            {customer.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">{task.title}</h1>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">{customer.name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                เริ่มต้น {task.createdAt}
              </span>
              {task.contactName && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  ผู้ติดต่อ: <span className="font-medium text-foreground">{task.contactName}</span>
                </span>
              )}
              {task.contactPhone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {task.contactPhone}
                </span>
              )}
              {task.contactEmail && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {task.contactEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        {task.workItems.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ความคืบหน้า</span>
              <span className="text-sm font-bold text-blue-600">{getTaskProgress(task)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all"
                style={{ width: `${getTaskProgress(task)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Brief */}
      {task.brief && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Brief งาน
          </h2>
          <p className="text-sm text-foreground leading-relaxed bg-blue-50 rounded-xl p-4 border border-blue-100">
            {task.brief}
          </p>
        </div>
      )}

      {/* Work Items */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            รายการงาน ({visibleWorkItems.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">งานที่เราดำเนินการให้คุณ</p>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          {visibleWorkItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">ยังไม่มีรายการงาน</p>
            </div>
          ) : (
            visibleWorkItems.map((item) => {
              const isDone = item.status === "done";
              const isExpanded = expandedWork === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all",
                    isDone ? "border-green-200 bg-green-50/30" : "border-border bg-white"
                  )}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      isDone ? "bg-green-500" : "bg-muted border-2 border-muted-foreground/30"
                    )}>
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium text-sm", isDone && "text-green-700")}>
                          {item.title}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          ครบกำหนด {item.dueDate}
                        </span>
                        {item.completedAt && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            เสร็จ {item.completedAt}
                          </span>
                        )}
                      </div>

                      {/* Evidence toggle */}
                      {isDone && (item.evidence?.length || item.evidenceNote) && (
                        <button
                          onClick={() => setExpandedWork(isExpanded ? null : item.id)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 mt-2 hover:underline font-medium"
                        >
                          <Paperclip className="w-3 h-3" />
                          ดูหลักฐานการทำงาน
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Evidence Panel */}
                  {isExpanded && isDone && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">หลักฐานการทำงาน</p>
                        {item.evidence && item.evidence.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.evidence.map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg border border-blue-100">
                                <Paperclip className="w-3 h-3" />
                                {f}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.evidenceNote && (
                          <p className="text-sm text-foreground leading-relaxed">{item.evidenceNote}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Financial Documents */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            เอกสารทางการเงิน
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          {/* Amount + Status */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{formatCurrency(task.cashCollection.amount)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">มูลค่างานทั้งหมด</p>
            </div>
            <PaymentBadge status={task.cashCollection.status} />
          </div>

          {/* Document List */}
          {financialDocs.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">เอกสารที่แนบ</p>
              {financialDocs.map((doc) => {
                const cfg = DOC_TYPE_CONFIG[doc.docType] || DOC_TYPE_CONFIG.other;
                const Icon = cfg.icon;
                return (
                  <div
                    key={doc.id}
                    className={cn("flex items-center gap-3 p-3 rounded-xl border", cfg.color)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0 border border-current/10">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {doc.docType === "other" && doc.otherLabel ? doc.otherLabel : cfg.label}
                      </p>
                      {doc.docDate && (
                        <p className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {doc.docDate}
                        </p>
                      )}
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-medium hover:underline flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        เปิด
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">ยังไม่มีเอกสารทางการเงิน</p>
            </div>
          )}

          {/* Paid confirmation */}
          {task.cashCollection.status === "paid" && (
            <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">ชำระเงินครบถ้วนแล้ว ขอบคุณครับ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
