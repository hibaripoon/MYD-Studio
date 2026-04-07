/**
 * Customer CRM Tab
 * Shows all customers grouped by type (SME, Agency, Brand)
 * Click customer to see their tasks — with Edit/Delete support
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Building2, Users, Star, TrendingUp,
  Phone, Mail, Briefcase, FileText, Receipt,
  X, Edit3, Trash2, AlertTriangle, ChevronRight, Link2, Copy, Check,
  ArrowLeft, Calendar, DollarSign, CheckCircle2, Clock, ExternalLink, Paperclip,
  UserPlus, UserX, Upload, Loader2, Eye, EyeOff, KeyRound,
  LayoutList, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  Customer, CustomerType, getCustomerTypeColor,
  getTaskProgress, formatCurrency, Task, AppUser
} from "@/lib/database";
import { trpc } from "@/lib/trpc";
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
  profilePhoto: string;
};

const emptyForm: CustomerForm = {
  brandName: "", type: "SME",
  contactName: "", contactPhone: "", contactEmail: "",
  taxCompanyName: "", taxAddress: "", taxId: "",
  profilePhoto: "",
};

export default function CustomerCRMTab() {
  const [, navigate] = useLocation();
  const { customers, tasks, appUsers } = useDatabase();
  const utils = trpc.useUtils();

  const uploadLogoMutation = trpc.files.upload.useMutation();
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadLogoMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        fileData: base64,
        folder: "customer-logos",
      });
      setForm((f) => ({ ...f, profilePhoto: result.url }));
      toast.success("อัปโหลด Logo เรียบร้อยแล้ว");
    } catch {
      toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLogoUploading(false);
    }
  };

  const createCustomerMutation = trpc.customers.create.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("เพิ่มลูกค้าเรียบร้อยแล้ว"); },
    onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
  });

  const updateCustomerMutation = trpc.customers.update.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); setShowEdit(null); setForm(emptyForm); toast.success("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว"); },
    onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
  });

  const deleteCustomerMutation = trpc.customers.delete.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("ลบลูกค้าเรียบร้อยแล้ว"); setShowDeleteConfirm(null); setSelectedCustomer(null); },
    onError: (err) => { toast.error(err.message || "ไม่สามารถลบลูกค้าที่มีงานอยู่ได้"); setShowDeleteConfirm(null); },
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Restore drawer from ?customer= query param when navigating back from task detail
  const initialCustomerId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("customer") || ""
    : "";
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    if (!initialCustomerId) return null;
    return customers.find((c) => c.id === initialCustomerId) || null;
  });
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
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarInitials = form.brandName.slice(0, 2).toUpperCase();
    createCustomerMutation.mutate({
      brandName: form.brandName,
      type: form.type,
      avatarInitials,
      avatarColor,
      profilePhoto: form.profilePhoto || undefined,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      taxCompanyName: form.taxCompanyName || undefined,
      taxAddress: form.taxAddress || undefined,
      taxId: form.taxId || undefined,
    });
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
      profilePhoto: customer.profilePhoto || "",
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
    updateCustomerMutation.mutate({
      id: showEdit.id,
      brandName: form.brandName,
      type: form.type,
      profilePhoto: form.profilePhoto || undefined,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
      taxCompanyName: form.taxCompanyName || undefined,
      taxAddress: form.taxAddress || undefined,
      taxId: form.taxId || undefined,
    });
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    deleteCustomerMutation.mutate({ id: showDeleteConfirm.id });
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
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            title="List View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          เพิ่มลูกค้า
        </Button>
      </div>

      {/* Customer Grid/List */}
      <div className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2")}>
        {filtered.map((customer) => {
          const customerTasks = getCustomerTasks(customer.id);
          const activeTasks = customerTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
          const totalValue = customerTasks.reduce((sum, t) => sum + t.cashCollection.amount, 0);

          const avatarEl = customer.profilePhoto ? (
            <img src={customer.profilePhoto} alt={customer.brandName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
          );

          if (viewMode === "list") {
            return (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="w-full bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-3.5 text-left group flex items-center gap-3"
              >
                {avatarEl}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors text-sm">{customer.brandName}</p>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0", getCustomerTypeColor(customer.type))}>{customer.type}</span>
                  </div>
                  {customer.contactName && <p className="text-xs text-muted-foreground truncate">{customer.contactName}</p>}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-bold text-foreground">{customerTasks.length}</p>
                    <p className="text-xs text-muted-foreground">งาน</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-bold text-blue-600">{activeTasks.length}</p>
                    <p className="text-xs text-muted-foreground">กำลังทำ</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-muted-foreground">มูลค่า</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-white rounded-xl border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5 text-left group"
            >
              <div className="flex items-start gap-3 mb-4">
                {customer.profilePhoto ? (
                  <img src={customer.profilePhoto} alt={customer.brandName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0", customer.avatarColor)}>
                    {customer.avatarInitials}
                  </div>
                )}
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
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-lg font-bold text-foreground leading-none">{customerTasks.length}</p>
                  <p className="text-xs text-muted-foreground leading-none">งานทั้งหมด</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-lg font-bold text-blue-600 leading-none">{activeTasks.length}</p>
                  <p className="text-xs text-muted-foreground leading-none">กำลังทำ</p>
                </div>
                <div className="flex flex-col items-center gap-0.5 min-w-0">
                  <p className="text-lg font-bold text-emerald-600 leading-none w-full text-center truncate">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-muted-foreground leading-none">มูลค่ารวม</p>
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
          allAppUsers={appUsers}
          onClose={() => setSelectedCustomer(null)}
          onTaskClick={(taskId) => navigate(`/ae/task/${taskId}?from=crm&customer=${selectedCustomer?.id || ""}`)}
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
        onLogoUpload={handleLogoUpload}
        isLogoUploading={logoUploading}
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
  open, title, form, setForm, onClose, onSubmit, submitLabel, onLogoUpload, isLogoUploading
}: {
  open: boolean;
  title: string;
  form: CustomerForm;
  setForm: React.Dispatch<React.SetStateAction<CustomerForm>>;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  onLogoUpload?: (file: File) => void;
  isLogoUploading?: boolean;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Logo / Profile Photo Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border relative">
              {form.profilePhoto ? (
                <img src={form.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">ไม่มีรูป</div>
              )}
              {isLogoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Logo / รูปโปรไฟล์ (ไม่บังคับ)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={form.profilePhoto}
                  onChange={set("profilePhoto")}
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 gap-1.5"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isLogoUploading}
                >
                  <Upload className="w-3.5 h-3.5" />
                  อัปโหลด
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onLogoUpload) onLogoUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">อัปโหลดไฟล์รูปได้เลย หรือวาง URL โดยตรง</p>
            </div>
          </div>

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
  customer, tasks, allAppUsers, onClose, onTaskClick, onEdit, onDelete
}: {
  customer: Customer;
  tasks: Task[];
  allAppUsers: AppUser[];
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const utils = trpc.useUtils();
  const hasActiveTasks = tasks.some((t) => t.status !== "cancelled");

  // Customer users for this customer
  const customerUsers = allAppUsers.filter((u) => u.role === "customer" && u.customerId === customer.id);

  // Add customer user state
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ phone: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const createUserMutation = trpc.appUsers.create.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      setShowAddUser(false);
      setUserForm({ phone: "", password: "", name: "" });
      toast.success("เพิ่ม User ลูกค้าเรียบร้อยแล้ว");
    },
    onError: (err) => toast.error(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่"),
  });

  const deleteUserMutation = trpc.appUsers.delete.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      setDeleteUserId(null);
      toast.success("ลบ User เรียบร้อยแล้ว");
    },
    onError: () => toast.error("ลบไม่สำเร็จ กรุณาลองใหม่"),
  });

  const handleAddUser = () => {
    if (!userForm.phone || !userForm.password) {
      toast.error("กรุณากรอกเบอร์โทรและรหัสผ่าน");
      return;
    }
    if (userForm.password.length < 4) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }
    const existing = allAppUsers.find((u) => u.phone.replace(/[-\s]/g, "") === userForm.phone.replace(/[-\s]/g, ""));
    if (existing) { toast.error("เบอร์โทรนี้มีในระบบแล้ว"); return; }
    createUserMutation.mutate({
      phone: userForm.phone,
      password: userForm.password,
      role: "customer",
      name: userForm.name || customer.contactName || customer.brandName,
      avatarInitials: customer.avatarInitials,
      avatarColor: customer.avatarColor,
      customerId: customer.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border flex-wrap">
          {customer.profilePhoto ? (
            <img src={customer.profilePhoto} alt={customer.brandName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0", customer.avatarColor)}>
              {customer.avatarInitials}
            </div>
          )}
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

        {/* Customer Users Section */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ลูกค้า ({customerUsers.length})</p>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              เพิ่ม User
            </button>
          </div>
          {customerUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">ยังไม่มี User ลูกค้า</p>
          ) : (
            <div className="space-y-2">
              {customerUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", u.avatarColor)}>
                    {u.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.phone}</p>
                  </div>
                  <button
                    onClick={() => setDeleteUserId(u.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="ลบ User"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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

      {/* Add Customer User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่ม User ลูกค้า — {customer.brandName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อ (ไม่บังคับ)</Label>
              <Input
                placeholder={customer.contactName || customer.brandName}
                value={userForm.name}
                onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร <span className="text-red-500">*</span></Label>
              <Input
                placeholder="08x-xxx-xxxx"
                value={userForm.phone}
                onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>ยกเลิก</Button>
            <Button onClick={handleAddUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่ม User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer User Confirm */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ User ลูกค้า?</AlertDialogTitle>
            <AlertDialogDescription>
              User นี้จะไม่สามารถเข้าสู่ระบบได้อีก การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteUserId && deleteUserMutation.mutate({ id: deleteUserId })}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "กำลังลบ..." : "ลบ User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                  : task.cashCollection.status === "invoiced"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              )}>
                {task.cashCollection.status === "paid" ? "ชำระครบแล้ว" :
                  task.cashCollection.status === "invoiced" ? "ส่ง Invoice แล้ว" : "ยังไม่ชำระ"}
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
