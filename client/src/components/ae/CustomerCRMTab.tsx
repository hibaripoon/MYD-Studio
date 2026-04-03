/**
 * Customer CRM Tab
 * Shows all customers grouped by type (SME, Agency, Brand)
 * Click customer to see their tasks
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, Search, Building2, Users, Star, ChevronRight,
  Phone, Mail, Briefcase, TrendingUp, CheckCircle2, Clock,
  X, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  db, Customer, CustomerType, getCustomerTypeLabel, getCustomerTypeColor,
  getTaskProgress, formatCurrency, Task
} from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeFilters: { value: CustomerType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "ทั้งหมด", icon: Users },
  { value: "SME", label: "SME", icon: Building2 },
  { value: "Agency", label: "Agency", icon: Star },
  { value: "Brand", label: "Brand", icon: TrendingUp },
];

export default function CustomerCRMTab() {
  const [, navigate] = useLocation();
  const { customers, tasks } = useDatabase();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", type: "SME" as CustomerType,
    contactName: "", contactEmail: "", contactPhone: "",
  });

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const getCustomerTasks = (customerId: string) =>
    tasks.filter((t) => t.customerId === customerId);

  const handleCreate = () => {
    if (!form.name || !form.company || !form.contactName) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    db.createCustomer({
      name: form.name,
      company: form.company,
      type: form.type,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      avatarColor: "bg-blue-500",
    });
    setShowCreate(false);
    setForm({ name: "", company: "", type: "SME", contactName: "", contactEmail: "", contactPhone: "" });
    toast.success("เพิ่มลูกค้าเรียบร้อยแล้ว");
  };

  // Stats
  const stats = {
    total: customers.length,
    sme: customers.filter((c) => c.type === "SME").length,
    agency: customers.filter((c) => c.type === "Agency").length,
    brand: customers.filter((c) => c.type === "Brand").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-blue-500 p-4 shadow-sm">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">ลูกค้าทั้งหมด</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-emerald-500 p-4 shadow-sm">
          <p className="text-2xl font-bold">{stats.sme}</p>
          <p className="text-sm text-muted-foreground">SME</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-violet-500 p-4 shadow-sm">
          <p className="text-2xl font-bold">{stats.agency}</p>
          <p className="text-sm text-muted-foreground">Agency</p>
        </div>
        <div className="bg-white rounded-xl border border-border border-l-4 border-l-blue-400 p-4 shadow-sm">
          <p className="text-2xl font-bold">{stats.brand}</p>
          <p className="text-sm text-muted-foreground">Brand</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาลูกค้า หรือบริษัท..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* Type Filter Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
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
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
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
                    {customer.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border mt-1", getCustomerTypeColor(customer.type))}>
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
          onTaskClick={(taskId) => navigate(`/ae/task/${taskId}`)}
        />
      )}

      {/* Create Customer Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ชื่อลูกค้า <span className="text-red-500">*</span></Label>
                <Input placeholder="คุณ..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>ประเภท</Label>
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
            <div className="space-y-1.5">
              <Label>บริษัท/ร้านค้า <span className="text-red-500">*</span></Label>
              <Input placeholder="ชื่อบริษัท" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อผู้ติดต่อ <span className="text-red-500">*</span></Label>
              <Input placeholder="ชื่อ-นามสกุล" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>อีเมล</Label>
                <Input type="email" placeholder="email@..." value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>เบอร์โทร</Label>
                <Input placeholder="08x-xxx-xxxx" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">เพิ่มลูกค้า</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerDetailDrawer({
  customer, tasks, onClose, onTaskClick
}: {
  customer: Customer;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0", customer.avatarColor)}>
            {customer.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-foreground">{customer.name}</h2>
            <p className="text-muted-foreground text-sm">{customer.company}</p>
          </div>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getCustomerTypeColor(customer.type))}>
            {customer.type}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ข้อมูลติดต่อ</p>
          <div className="space-y-2">
            {customer.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{customer.contactEmail}</span>
              </div>
            )}
            {customer.contactPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{customer.contactPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">งานทั้งหมด ({tasks.length})</p>
          </div>
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
                    <p className="font-medium text-sm text-foreground group-hover:text-blue-600 transition-colors">{task.title}</p>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{task.createdAt}</span>
                    <span className="text-xs font-semibold">{formatCurrency(task.cashCollection.amount)}</span>
                  </div>
                  {task.workItems.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${getTaskProgress(task)}%` }}
                        />
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
