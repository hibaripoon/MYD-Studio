/**
 * User Management Page
 * Manage AE users and Customer users (phone-based login accounts)
 * Two sections: AE Users | Customer Users
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users, UserPlus, Trash2, Edit3, Phone, Mail, Building2,
  Shield, UserCheck, ArrowLeft, Zap, AlertTriangle, Eye, EyeOff, X, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDatabase } from "@/contexts/DatabaseContext";
import { db, AppUser, clearSession, getSession } from "@/lib/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserManagementPage() {
  const [, navigate] = useLocation();
  const { customers } = useDatabase();
  const [users, setUsers] = useState<AppUser[]>(db.getUsers());
  const [activeTab, setActiveTab] = useState<"ae" | "customer">("ae");
  const [showCreateAE, setShowCreateAE] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AppUser | null>(null);
  const [showEditUser, setShowEditUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [aeForm, setAeForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [custForm, setCustForm] = useState({ customerId: "", phone: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", password: "" });

  // Auth guard
  useEffect(() => {
    const session = getSession();
    if (!session) { navigate("/login"); return; }
    const user = db.getUserById(session.userId);
    if (!user || user.role !== "ae") { navigate("/ae"); return; }
  }, [navigate]);

  // Subscribe to user changes
  useEffect(() => {
    const unsub = db.subscribe(() => setUsers(db.getUsers()));
    return unsub;
  }, []);

  const aeUsers = users.filter((u) => u.role === "ae");
  const customerUsers = users.filter((u) => u.role === "customer");

  const handleCreateAE = () => {
    if (!aeForm.name || !aeForm.phone || !aeForm.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const existing = users.find((u) => u.phone.replace(/[-\s]/g, "") === aeForm.phone.replace(/[-\s]/g, ""));
    if (existing) { toast.error("เบอร์โทรนี้มีในระบบแล้ว"); return; }
    db.createUser({
      phone: aeForm.phone,
      password: aeForm.password,
      role: "ae",
      name: aeForm.name,
      email: aeForm.email,
      avatarInitials: aeForm.name.slice(0, 2),
      avatarColor: "bg-blue-500",
      aeId: `ae_${Date.now()}`,
    });
    setShowCreateAE(false);
    setAeForm({ name: "", phone: "", email: "", password: "" });
    toast.success("เพิ่ม AE เรียบร้อยแล้ว");
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
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
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
            ออกจากระบบ
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการบัญชีผู้ใช้ AE และลูกค้าในระบบ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setActiveTab("ae")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "ae" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
            AE Users ({aeUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("customer")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "customer" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCheck className="w-4 h-4" />
            Customer Users ({customerUsers.length})
          </button>
        </div>

        {/* AE Users Tab */}
        {activeTab === "ae" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">บัญชีสำหรับทีม AE ที่สามารถเข้าถึงระบบหลังบ้านได้</p>
              <Button onClick={() => setShowCreateAE(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                เพิ่ม AE
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ชื่อ</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">เบอร์โทร</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">อีเมล</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {aeUsers.map((user, i) => (
                    <tr key={user.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", user.avatarColor)}>
                            {user.avatarInitials}
                          </div>
                          <span className="font-medium text-sm">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{user.phone}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{user.email || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <Shield className="w-3 h-3" />
                          AE
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditForm({ name: user.name, phone: user.phone, password: "" }); setShowEditUser(user); }}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Users Tab */}
        {activeTab === "customer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">บัญชีสำหรับลูกค้าที่ต้องการเข้าดู Customer Portal</p>
              <Button onClick={() => setShowCreateCustomer(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                เพิ่ม User ลูกค้า
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ชื่อ</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">เบอร์โทร (Login)</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ลูกค้า / แบรนด์</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customerUsers.map((user, i) => {
                    const customer = user.customerId ? customers.find((c) => c.id === user.customerId) : null;
                    return (
                      <tr key={user.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", user.avatarColor)}>
                              {user.avatarInitials}
                            </div>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{user.phone}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {customer ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {customer.brandName}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <UserCheck className="w-3 h-3" />
                            Customer
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditForm({ name: user.name, phone: user.phone, password: "" }); setShowEditUser(user); }}
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
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create AE Dialog */}
      <Dialog open={showCreateAE} onOpenChange={setShowCreateAE}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม AE User ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
              <Input placeholder="คุณ..." value={aeForm.name} onChange={(e) => setAeForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร (ใช้ Login) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="08x-xxx-xxxx" value={aeForm.phone} onChange={(e) => setAeForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" type="email" placeholder="email@..." value={aeForm.email} onChange={(e) => setAeForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={aeForm.password}
                  onChange={(e) => setAeForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAE(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateAE} className="bg-blue-600 hover:bg-blue-700">เพิ่ม AE</Button>
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

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบ User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ต้องการลบ <span className="font-semibold text-foreground">{showDeleteConfirm?.name}</span> ออกจากระบบ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
