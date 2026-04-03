/**
 * User Management Page
 * Manage Company users (Admin/Sub Admin/Head/AE) and Customer users
 * Two sections: Company Users | Customer Users
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users, UserPlus, Trash2, Edit3, Phone, Mail, Building2,
  Shield, UserCheck, ArrowLeft, Zap, AlertTriangle, Eye, EyeOff, X, LogOut,
  Crown, Star, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  db, AppUser, CompanyRole, clearSession, getSession,
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

export default function UserManagementPage() {
  const [, navigate] = useLocation();
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

  // Auth guard — only company users can access
  useEffect(() => {
    const session = getSession();
    if (!session) { navigate("/login"); return; }
    const user = db.getUserById(session.userId);
    if (!user || user.role !== "company") { navigate("/ae"); return; }
  }, [navigate]);

  // Subscribe to user changes
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

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/ae")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">User Management</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการบัญชีผู้ใช้ฝั่ง Company และลูกค้าในระบบ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit mb-6">
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
      </div>

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

function getRoleColor(role: CompanyRole): string {
  const colors: Record<CompanyRole, string> = {
    admin: "bg-red-500",
    sub_admin: "bg-orange-500",
    head: "bg-purple-500",
    ae: "bg-blue-500",
  };
  return colors[role];
}
