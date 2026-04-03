/**
 * Customer CRM Tab
 * Shows all customers grouped by type (SME, Agency, Brand)
 * Click customer to see their tasks — with Edit/Delete support
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Building2, Users, Star, TrendingUp,
  Phone, Mail, Briefcase, FileText, Receipt,
  X, Edit3, Trash2, AlertTriangle, ChevronRight, Link2, Copy, Check,
  ArrowLeft, Calendar, DollarSign, CheckCircle2, Clock, ExternalLink, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  db, Customer, CustomerType, getCustomerTypeColor,
  getTaskProgress, formatCurrency, Task
} from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeFilters: { value: CustomerType | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "SME", label: "SME" },
  { value: "Agency", label: "Agency" },
  { value: "Brand", label: "Brand" },
];

type CustomerForm = {
  brandName: string;
  type: CustomerType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  taxCompanyName: string;
  taxAddress: string;
  taxId: string;
};

const emptyForm: CustomerForm = {
  brandName: "", type: "SME",
  contactName: "", contactPhone: "", contactEmail: "",
  taxCompanyName: "", taxAddress: "", taxId: "",
};

export default function CustomerCRMTab() {
  const [, navigate] = useLocation();
  const { customers, tasks } = useDatabase();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.brandName.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactName || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const getCustomerTasks = (customerId: string) =>
    tasks.filter((t) => t.customerId === customerId);

  const handleCreate = () => {
    if (!form.brandName) {
      toast.error("กรุณากรอกชื่อแบรนด์/Agency");
      return;
    }
    db.createCustomer({
      brandName: form.brandName,
      type: form.type,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      taxCompanyName: form.taxCompanyName || undefined,
      taxAddress: form.taxAddress || undefined,
      taxId: form.taxId || undefined,
    });
    setShowCreate(false);
    setForm(emptyForm);
    toast.success("เพิ่มลูกค้าเรียบร้อยแล้ว");
  };

  const handleEditOpen = (customer: Customer) => {
    setForm({
      brandName: customer.brandName,
      type: customer.type,
      contactName: customer.contactName || "",
      contactPhone: customer.contactPhone || "",
      contactEmail: customer.contactEmail || "",
      taxCompanyName: customer.taxCompanyName || "",
      taxAddress: customer.taxAddress || "",
      taxId: customer.taxId || "",
    });
    setShowEdit(customer);
    setSelectedCustomer(null);
  };

  const handleEditSave = () => {
    if (!showEdit) return;
    if (!form.brandName) {
      toast.error("กรุณากรอกชื่อแบรนด์/Agency");
      return;
    }
    db.updateCustomer(showEdit.id, {
      brandName: form.brandName,
      type: form.type,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      taxCompanyName: form.taxCompanyName || undefined,
      taxAddress: form.taxAddress || undefined,
      taxId: form.taxId || undefined,
    });
    setShowEdit(null);
    setForm(emptyForm);
    toast.success("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    const success = db.deleteCustomer(showDeleteConfirm.id);
    if (success) {
      toast.success("ลบลูกค้าเรียบร้อยแล้ว");
      setShowDeleteConfirm(null);
      setSelectedCustomer(null);
    } else {
      toast.error("ไม่สามารถลบลูกค้าที่มีงานอยู่ได้");
      setShowDeleteConfirm(null);
    }
  };

  const stats = {
    total: customers.length,
    sme: customers.filter((c) => c.type === "SME").length,
    agency: customers.filter((c) => c.type === "Agency").length,
    brand: customers.filter((c) => c.type === "Brand").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-blue-500 p-3 sm:p-4 shadow-sm">
          <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">ลูกค้าทั้งหมด</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-emerald-500 p-3 sm:p-4 shadow-sm">
          <p className="text-xl sm:text-2xl font-bold">{stats.sme}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">SME</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-violet-500 p-3 sm:p-4 shadow-sm">
          <p className="text-xl sm:text-2xl font-bold">{stats.agency}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Agency</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-blue-400 p-3 sm:p-4 shadow-sm">
          <p className="text-xl sm:text-2xl font-bold">{stats.brand}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Brand</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาแบรนด์ หรือชื่อผู้ติดต่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                typeFilter === f.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          เพิ่มลูกค้า
        </Button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const customerTasks = getCustomerTasks(customer.id);
          const activeTasks = customerTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
          const totalValue = customerTasks.reduce((sum, t) => sum + t.cashCollection.amount, 0);

          return (
            <button
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5 text-left group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0", customer.avatarColor)}>
                  {customer.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                    {customer.brandName}
                  </p>
                  {customer.contactName && (
                    <p className="text-sm text-muted-foreground truncate">{customer.contactName}</p>
                  )}
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1", getCustomerTypeColor(customer.type))}>
                    {customer.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{customerTasks.length}</p>
                  <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{activeTasks.length}</p>
                  <p className="text-xs text-muted-foreground">กำลังทำ</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">มูลค่ารวม</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ไม่พบลูกค้า</p>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          tasks={getCustomerTasks(selectedCustomer.id)}
          onClose={() => setSelectedCustomer(null)}
          onTaskClick={(taskId) => navigate(`/ae/task/${taskId}?from=crm`)}
          onEdit={() => handleEditOpen(selectedCustomer)}
          onDelete={() => { setShowDeleteConfirm(selectedCustomer); setSelectedCustomer(null); }}
        />
      )}

      {/* Create / Edit Dialog */}
      <CustomerFormDialog
        open={showCreate || showEdit !== null}
        title={showEdit ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
        form={form}
        setForm={setForm}
        onClose={() => { setShowCreate(false); setShowEdit(null); setForm(emptyForm); }}
        onSubmit={showEdit ? handleEditSave : handleCreate}
        submitLabel={showEdit ? "บันทึก" : "เพิ่มลูกค้า"}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบลูกค้า
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ต้องการลบ <span className="font-semibold text-foreground">{showDeleteConfirm?.brandName}</span> ออกจากระบบ?
            การลบจะไม่สามารถย้อนกลับได้
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบลูกค้า</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Customer Form Dialog (Create & Edit) ─────────────────────

function CustomerFormDialog({
  open, title, form, setForm, onClose, onSubmit, submitLabel
}: {
  open: boolean;
  title: string;
  form: CustomerForm;
  setForm: React.Dispatch<React.SetStateAction<CustomerForm>>;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const set = (key: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Required Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              ข้อมูลลูกค้า <span className="text-red-500 normal-case font-normal">(จำเป็น)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>ชื่อแบรนด์ / Agency <span className="text-red-500">*</span></Label>
                <Input placeholder="เช่น Beauty Brand Thailand" value={form.brandName} onChange={set("brandName")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>ประเภทลูกค้า <span className="text-red-500">*</span></Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CustomerType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SME">SME</SelectItem>
                    <SelectItem value="Agency">Agency</SelectItem>
                    <SelectItem value="Brand">Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              ข้อมูลติดต่อ <span className="normal-case font-normal">(ไม่บังคับ)</span>
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>ชื่อผู้ติดต่อ</Label>
                <Input placeholder="คุณ..." value={form.contactName} onChange={set("contactName")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>เบอร์โทร</Label>
                  <Input placeholder="08x-xxx-xxxx" value={form.contactPhone} onChange={set("contactPhone")} />
                </div>
                <div className="space-y-1.5">
                  <Label>อีเมล</Label>
                  <Input type="email" placeholder="email@..." value={form.contactEmail} onChange={set("contactEmail")} />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              ข้อมูลใบกำกับภาษี <span className="normal-case font-normal">(ไม่บังคับ)</span>
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>ชื่อบริษัท (สำหรับออกใบกำกับ)</Label>
                <Input placeholder="บริษัท ... จำกัด" value={form.taxCompanyName} onChange={set("taxCompanyName")} />
              </div>
              <div className="space-y-1.5">
                <Label>ที่อยู่บริษัท</Label>
                <Input placeholder="เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" value={form.taxAddress} onChange={set("taxAddress")} />
              </div>
              <div className="space-y-1.5">
                <Label>เลขผู้เสียภาษี</Label>
                <Input placeholder="0000000000000" value={form.taxId} onChange={set("taxId")} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Customer Detail Drawer ────────────────────────────────────

function CustomerDetailDrawer({
  customer, tasks, onClose, onTaskClick, onEdit, onDelete
}: {
  customer: Customer;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasActiveTasks = tasks.some((t) => t.status !== "cancelled");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border flex-wrap">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0", customer.avatarColor)}>
            {customer.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-foreground truncate">{customer.brandName}</h2>
            {customer.contactName && (
              <p className="text-muted-foreground text-sm">{customer.contactName}</p>
            )}
          </div>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0", getCustomerTypeColor(customer.type))}>
            {customer.type}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <CopyLinkButton customerId={customer.id} />
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="แก้ไข"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={hasActiveTasks}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                hasActiveTasks
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
              )}
              title={hasActiveTasks ? "ไม่สามารถลบได้เนื่องจากมีงานอยู่" : "ลบลูกค้า"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border space-y-4">
          {(customer.contactEmail || customer.contactPhone) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ข้อมูลติดต่อ</p>
              <div className="space-y-1.5">
                {customer.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.contactPhone}</span>
                  </div>
                )}
                {customer.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {(customer.taxCompanyName || customer.taxId) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ข้อมูลใบกำกับภาษี</p>
              <div className="space-y-1.5">
                {customer.taxCompanyName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.taxCompanyName}</span>
                  </div>
                )}
                {customer.taxAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{customer.taxAddress}</span>
                  </div>
                )}
                {customer.taxId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span>เลขผู้เสียภาษี: <span className="font-mono">{customer.taxId}</span></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm font-semibold text-foreground mb-3">งานทั้งหมด ({tasks.length})</p>
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีงาน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="w-full bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-sm transition-all p-4 text-left group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm text-foreground group-hover:text-blue-600 transition-colors min-w-0 flex-1 truncate">{task.title}</p>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{task.createdAt}</span>
                    <span className="text-xs font-semibold">{formatCurrency(task.cashCollection.amount)}</span>
                  </div>
                  {task.workItems.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${getTaskProgress(task)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{getTaskProgress(task)}%</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── In-Drawer Task Detail ───────────────────────────────────

function InDrawerTaskDetail({ task, customer, onBack }: { task: Task; customer: Customer; onBack: () => void }) {
  const progress = getTaskProgress(task);
  const docs = task.cashCollection.documents || [];

  return (
    <div className="flex flex-col h-full">
      {/* Back bar */}
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับรายการงาน
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Task Header */}
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-foreground min-w-0 flex-1">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{customer.brandName}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />สร้าง: {task.createdAt}</span>
            {task.cashCollection.dueDate && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />กำหนด: {task.cashCollection.dueDate}</span>}
          </div>
          {task.workItems.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>ความคืบหน้า</span><span>{progress}%</span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Work Items */}
        {task.workItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">รายการงาน</p>
            <div className="space-y-2">
              {task.workItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                      {item.evidence && item.evidence.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.evidence.map((ev, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip className="w-3 h-3" />{ev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Collection */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">การเงิน</p>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">มูลค่างาน</span>
              <span className="font-bold text-base">{formatCurrency(task.cashCollection.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">สถานะการชำระ</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                task.cashCollection.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : task.cashCollection.status === "partial"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              )}>
                {task.cashCollection.status === "paid" ? "ชำระแล้ว" :
                  task.cashCollection.status === "partial" ? "ชำระบางส่วน" : "ยังไม่ชำระ"}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Docs */}
        {docs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">เอกสารการเงิน</p>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg border border-border p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.docType === "other" ? doc.otherLabel || "อื่นๆ" : doc.docType}</p>
                      {doc.docDate && <p className="text-xs text-muted-foreground">{doc.docDate}</p>}
                    </div>
                  </div>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Copy Link Button ──────────────────────────────────────────

function CopyLinkButton({ customerId }: { customerId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Build the customer portal URL based on current origin
    const portalUrl = `${window.location.origin}/customer/${customerId}`;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success("คัดลอก Link ลูกค้าแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement("textarea");
      el.value = portalUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast.success("คัดลอก Link ลูกค้าแล้ว");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
        copied
          ? "text-green-600 bg-green-50"
          : "text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50"
      )}
      title="คัดลอก Link สำหรับลูกค้า"
    >
      {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
    </button>
  );
}
