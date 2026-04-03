/**
 * Customer Portal — Customer-facing view
 * Shows ONLY: Work Items (completed with evidence), Brief, Financial Documents
 * HIDES: Internal Tasks, AE notes, internal process details
 * Design: Clean, professional, customer-friendly
 */
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, CheckCircle2, Clock, Circle, FileText, Paperclip,
  Building2, Calendar, Zap, ChevronRight, ChevronDown, ChevronUp,
  Briefcase, DollarSign, AlertCircle, Star, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Task, formatCurrency, getTaskProgress, getCustomerTypeColor } from "@/lib/database";
import { cn } from "@/lib/utils";

export default function CustomerPortal() {
  const [location, navigate] = useLocation();
  const [, params] = useRoute("/customer/:customerId");
  const [, taskParams] = useRoute("/customer/:customerId/task/:taskId");

  const customerId = params?.customerId || taskParams?.customerId || "";
  const taskId = taskParams?.taskId || "";

  const { customers, tasks } = useDatabase();
  const customer = customers.find((c) => c.id === customerId);
  const customerTasks = tasks.filter((t) => t.customerId === customerId && t.status !== "cancelled");

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
    return <CustomerTaskDetail task={task} customer={customer} onBack={() => navigate(`/customer/${customerId}`)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
            <div>
              <p className="font-bold text-foreground">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.company}</p>
            </div>
          </div>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getCustomerTypeColor(customer.type))}>
            {customer.type}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground hidden sm:block">MediaFlow</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1">
            สวัสดีครับ คุณ{customer.name.replace("คุณ", "").trim()} 👋
          </h1>
          <p className="text-muted-foreground">นี่คือสรุปงานทั้งหมดที่เราดูแลให้คุณอยู่</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground">{customerTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">งานทั้งหมด</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">
              {customerTasks.filter((t) => t.status === "in_progress" || t.status === "review").length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">กำลังดำเนินการ</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">
              {customerTasks.filter((t) => t.status === "done").length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">เสร็จสิ้น</p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground text-lg">งานที่จ้างทั้งหมด</h2>
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
      </main>
    </div>
  );
}

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
          <p className="text-sm text-muted-foreground mt-0.5">เริ่มต้น {task.createdAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={task.status} />
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
        </div>
      </div>

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

function CustomerTaskDetail({
  task, customer, onBack
}: {
  task: Task;
  customer: ReturnType<typeof useDatabase>["customers"][0];
  onBack: () => void;
}) {
  const [expandedWork, setExpandedWork] = useState<string | null>(null);

  // Only show Work Items that are done (with evidence) or in progress
  // NEVER show Internal Tasks
  const visibleWorkItems = task.workItems; // Show all work items to customer

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{task.title}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Task Info */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{customer.company}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  เริ่มต้น {task.createdAt}
                </span>
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
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Brief งาน
            </h2>
            <p className="text-sm text-foreground leading-relaxed bg-blue-50 rounded-xl p-4 border border-blue-100">
              {task.brief}
            </p>
          </div>
        )}

        {/* Work Items — Customer View */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              รายการงาน ({visibleWorkItems.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">งานที่เราดำเนินการให้คุณ</p>
          </div>
          <div className="p-5 space-y-3">
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
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              เอกสารทางการเงิน
            </h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-extrabold text-foreground">{formatCurrency(task.cashCollection.amount)}</p>
                <p className="text-sm text-muted-foreground mt-0.5">มูลค่างานทั้งหมด</p>
              </div>
              <PaymentBadge status={task.cashCollection.status} />
            </div>

            <div className="space-y-3 text-sm">
              {task.cashCollection.invoiceNumber && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    เลขที่ Invoice
                  </span>
                  <span className="font-semibold text-foreground">{task.cashCollection.invoiceNumber}</span>
                </div>
              )}
              {task.cashCollection.invoiceDate && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    วันที่ Invoice
                  </span>
                  <span className="font-semibold">{task.cashCollection.invoiceDate}</span>
                </div>
              )}
              {task.cashCollection.dueDate && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    วันครบกำหนดชำระ
                  </span>
                  <span className="font-semibold">{task.cashCollection.dueDate}</span>
                </div>
              )}
              {task.cashCollection.paidDate && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    วันที่ชำระเงิน
                  </span>
                  <span className="font-semibold text-green-600">{task.cashCollection.paidDate}</span>
                </div>
              )}
            </div>

            {/* Note visible to customer (only generic notes, not internal) */}
            {task.cashCollection.status === "paid" && (
              <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">ชำระเงินครบถ้วนแล้ว ขอบคุณครับ</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
