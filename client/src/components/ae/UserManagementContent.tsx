/**
 * UserManagementContent — embeddable inside AEPortal sidebar layout
 * Same logic as UserManagementPage but without standalone header/nav
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useEffect } from "react";
import {
  Users, UserPlus, Trash2, Edit3, Phone, Mail, Building2,
  Shield, UserCheck, Zap, AlertTriangle, Eye, EyeOff, X,
  Crown, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  db, AppUser, CompanyRole,
  COMPANY_ROLE_LABELS, COMPANY_ROLE_COLORS
} from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COMPANY_ROLES: CompanyRole[] = ["admin", "sub_admin", "head", "ae"];

const ROLE_ICONS: Record<CompanyRole, React.ElementType> = {
  admin: Crown,
  sub_admin: Star,
  head: Shield,
  ae: UserCheck,
};

function getRoleColor(role: CompanyRole): string {
  const colors: Record<CompanyRole, string> = {
    admin: "bg-red-500",
    sub_admin: "bg-orange-500",
    head: "bg-purple-500",
    ae: "bg-blue-500",
  };
  return colors[role];
}

export default function UserManagementContent() {
  const { customers } = useDatabase();
  const [users, setUsers] = useState<AppUser[]>(db.getUsers());
  const [activeTab, setActiveTab] = useState<"company" | "customer">("company");
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AppUser | null>(null);
  const [showEditUser, setShowEditUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: "", phone: "", email: "", password: "", companyRole: "ae" as CompanyRole
  });
  const [custForm, setCustForm] = useState({ customerId: "", phone: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", password: "", companyRole: "ae" as CompanyRole });

  useEffect(() => {
    const unsub = db.subscribe(() => setUsers(db.getUsers()));
    return unsub;
  }, []);

  const companyUsers = users.filter((u) => u.role === "company");
  const customerUsers = users.filter((u) => u.role === "customer");

  const handleCreateCompany = () => {
    if (!companyForm.name || !companyForm.phone || !companyForm.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const existing = users.find((u) => u.phone.replace(/[-\s]/g, "") === companyForm.phone.replace(/[-\s]/g, ""));
    if (existing) { toast.error("เบอร์โทรนี้มีในระบบแล้ว"); return; }
    db.createUser({
      phone: companyForm.phone,
      password: companyForm.password,
      role: "company",
      companyRole: companyForm.companyRole,
      name: companyForm.name,
      email: companyForm.email,
      avatarInitials: companyForm.name.slice(0, 2),
      avatarColor: getRoleColor(companyForm.companyRole),
      aeId: `ae_${Date.now()}`,
    });
    setShowCreateCompany(false);
    setCompanyForm({ name: "", phone: "", email: "", password: "", companyRole: "ae" });
    toast.success(`เพิ่ม ${COMPANY_ROLE_LABELS[companyForm.companyRole]} เรียบร้อยแล้ว`);
  };

  const handleCreateCustomer = () => {
    if (!custForm.customerId || !custForm.phone || !custForm.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const existing = users.find((u) => u.phone.replace(/[-\s]/g, "") === custForm.phone.replace(/[-\s]/g, ""));
    if (existing) { toast.error("เบอร์โทรนี้มีในระบบแล้ว"); return; }
    const customer = customers.find((c) => c.id === custForm.customerId);
    if (!customer) { toast.error("ไม่พบลูกค้า"); return; }
    db.createUser({
      phone: custForm.phone,
      password: custForm.password,
      role: "customer",
      name: customer.contactName || customer.brandName,
      avatarInitials: customer.avatarInitials,
      avatarColor: customer.avatarColor,
      customerId: custForm.customerId,
    });
    setShowCreateCustomer(false);
    setCustForm({ customerId: "", phone: "", password: "" });
    toast.success("เพิ่ม User ลูกค้าเรียบร้อยแล้ว");
  };

  const handleEditSave = () => {
    if (!showEditUser) return;
    if (!editForm.name || !editForm.phone) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const update: Partial<AppUser> = { name: editForm.name, phone: editForm.phone };
    if (editForm.password) update.password = editForm.password;
    if (showEditUser.role === "company") update.companyRole = editForm.companyRole;
    db.updateUser(showEditUser.id, update);
    setShowEditUser(null);
    toast.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    db.deleteUser(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    toast.success("ลบ User เรียบร้อยแล้ว");
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-full sm:w-fit mb-6">
        <button
          onClick={() => setActiveTab("company")}
          className={cn(
            "flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "company" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="w-4 h-4" />
          Company ({companyUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("customer")}
          className={cn(
            "flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "customer" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserCheck className="w-4 h-4" />
          Customer ({customerUsers.length})
        </button>
      </div>

      {/* Company Users Tab */}
      {activeTab === "company" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              บัญชีสำหรับทีมงาน — Admin/Sub Admin/Head เห็นงานทั้งหมด, AE เห็นเฉพาะงานตัวเอง
            </p>
            <Button onClick={() => setShowCreateCompany(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 ml-auto">
              <UserPlus className="w-4 h-4" />
              เพิ่ม User
            </Button>
          </div>

          {/* Role Legend */}
          <div className="flex flex-wrap gap-2">
            {COMPANY_ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              return (
                <span key={role} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", COMPANY_ROLE_COLORS[role])}>
                  <Icon className="w-3 h-3" />
                  {COMPANY_ROLE_LABELS[role]}
                </span>
              );
            })}
            <span className="text-xs text-muted-foreground self-center ml-1">— เห็นงานทั้งหมด ยกเว้น AE</span>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ชื่อ</th>
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">เบอร์โทร</th>
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">อีเมล</th>
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 sm:px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {companyUsers.map((user, i) => {
                    const role = user.companyRole || "ae";
                    const Icon = ROLE_ICONS[role];
                    return (
                      <tr key={user.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", user.avatarColor)}>
                              {user.avatarInitials}
                            </div>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-sm font-mono text-muted-foreground">{user.phone}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{user.email || "—"}</td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", COMPANY_ROLE_COLORS[role])}>
                            <Icon className="w-3 h-3" />
                            {COMPANY_ROLE_LABELS[role]}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditForm({ name: user.name, phone: user.phone, password: "", companyRole: user.companyRole || "ae" });
                                setShowEditUser(user);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {companyUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        ยังไม่มี Company User
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permission Table */}
          <div className="mt-6">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-foreground">ตารางสิทธิ์การเข้าถึงตาม Role</h2>
              <p className="text-xs text-muted-foreground mt-0.5">แต่ละ Role มีสิทธิ์การเข้าถึงข้อมูลแตกต่างกันดังนี้</p>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-52">สิทธิ์ / ฟีเจอร์</th>
                      {COMPANY_ROLES.map((role) => {
                        const Icon = ROLE_ICONS[role];
                        return (
                          <th key={role} className="text-center px-3 py-3">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", COMPANY_ROLE_COLORS[role])}>
                              <Icon className="w-3 h-3" />
                              {COMPANY_ROLE_LABELS[role]}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { label: "ดู Task ทั้งหมดในระบบ", perms: { admin: true, sub_admin: true, head: true, ae: false } },
                      { label: "ดู Task เฉพาะตัวเอง", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "สร้าง Task ใหม่", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "แก้ไข / อัปเดต Task", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "จัดการลูกค้า (CRM)", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "เพิ่ม / แก้ไขลูกค้า", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "ลบลูกค้า (ไม่มีงาน)", perms: { admin: true, sub_admin: true, head: true, ae: false } },
                      { label: "ดู Cash Collection ทั้งหมด", perms: { admin: true, sub_admin: true, head: true, ae: false } },
                      { label: "จัดการเอกสารทางการเงิน", perms: { admin: true, sub_admin: true, head: true, ae: true } },
                      { label: "เข้าถึง User Management", perms: { admin: true, sub_admin: true, head: false, ae: false } },
                      { label: "เพิ่ม / ลบ User ในระบบ", perms: { admin: true, sub_admin: true, head: false, ae: false } },
                      { label: "เปลี่ยน Role ของ User", perms: { admin: true, sub_admin: false, head: false, ae: false } },
                    ] as { label: string; perms: Record<CompanyRole, boolean> }[]).map((row, i) => (
                      <tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{row.label}</td>
                        {COMPANY_ROLES.map((role) => (
                          <td key={role} className="px-3 py-3 text-center">
                            {row.perms[role] ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50">
                                <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Users Tab */}
      {activeTab === "customer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground hidden sm:block">บัญชีสำหรับลูกค้าที่ต้องการเข้าดู Customer Portal</p>
            <Button onClick={() => setShowCreateCustomer(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 ml-auto">
              <UserPlus className="w-4 h-4" />
              เพิ่ม User ลูกค้า
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ชื่อ</th>
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">เบอร์โทร (Login)</th>
                    <th className="text-left px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ลูกค้า / แบรนด์</th>
                    <th className="px-4 sm:px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customerUsers.map((user, i) => {
                    const customer = user.customerId ? customers.find((c) => c.id === user.customerId) : null;
                    return (
                      <tr key={user.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", user.avatarColor)}>
                              {user.avatarInitials}
                            </div>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-sm font-mono text-muted-foreground">{user.phone}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-sm text-muted-foreground">
                          {customer ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {customer.brandName}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditForm({ name: user.name, phone: user.phone, password: "", companyRole: "ae" }); setShowEditUser(user); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {customerUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                        ยังไม่มี Customer User
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Company User Dialog */}
      <Dialog open={showCreateCompany} onOpenChange={setShowCreateCompany}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม Company User ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={companyForm.companyRole} onValueChange={(v) => setCompanyForm((f) => ({ ...f, companyRole: v as CompanyRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold", COMPANY_ROLE_COLORS[role])}>
                        {COMPANY_ROLE_LABELS[role]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {companyForm.companyRole === "ae"
                  ? "AE จะเห็นเฉพาะงานที่ตัวเองรับผิดชอบ"
                  : "สามารถเห็นงานทั้งหมดในระบบได้"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
              <Input placeholder="คุณ..." value={companyForm.name} onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร (ใช้ Login) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="08x-xxx-xxxx" value={companyForm.phone} onChange={(e) => setCompanyForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" type="email" placeholder="email@..." value={companyForm.email} onChange={(e) => setCompanyForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={companyForm.password}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCompany(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateCompany} className="bg-blue-600 hover:bg-blue-700">เพิ่ม User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Customer User Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม User ลูกค้า</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>เลือกลูกค้า <span className="text-red-500">*</span></Label>
              <Select value={custForm.customerId} onValueChange={(v) => setCustForm((f) => ({ ...f, customerId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแบรนด์/ลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.brandName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร (ใช้ Login) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="08x-xxx-xxxx" value={custForm.phone} onChange={(e) => setCustForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={custForm.password}
                  onChange={(e) => setCustForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCustomer(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateCustomer} className="bg-blue-600 hover:bg-blue-700">เพิ่ม User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser !== null} onOpenChange={() => setShowEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูล User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {showEditUser?.role === "company" && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editForm.companyRole} onValueChange={(v) => setEditForm((f) => ({ ...f, companyRole: v as CompanyRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{COMPANY_ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>ชื่อ <span className="text-red-500">*</span></Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร <span className="text-red-500">*</span></Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</Label>
              <Input type="password" placeholder="••••••••" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(null)}>ยกเลิก</Button>
            <Button onClick={handleEditSave} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            คุณต้องการลบ <span className="font-semibold text-foreground">{showDeleteConfirm?.name}</span> ออกจากระบบ?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>ยกเลิก</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
