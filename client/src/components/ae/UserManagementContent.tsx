/**
 * UserManagementContent — embeddable inside AEPortal sidebar layout
 * Uses tRPC appUsers.* for persistent user management
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState } from "react";
import {
  Users, UserPlus, Trash2, Edit3, Phone, Mail,
  Shield, UserCheck, AlertTriangle, Eye, EyeOff,
  Crown, Star, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  AppUser, CompanyRole,
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

export default function UserManagementContent() {
  const utils = trpc.useUtils();
  const { data: appUsers = [] } = trpc.appUsers.list.useQuery();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AppUser | null>(null);
  const [showEditUser, setShowEditUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", password: "", companyRole: "ae" as CompanyRole
  });
  const [editForm, setEditForm] = useState({
    name: "", phone: "", email: "", password: "", companyRole: "ae" as CompanyRole
  });

  // ─── Mutations ────────────────────────────────────────────────
  const createUserMutation = trpc.appUsers.create.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      setShowCreateUser(false);
      setForm({ name: "", phone: "", email: "", password: "", companyRole: "ae" });
      toast.success("เพิ่มผู้ใช้เรียบร้อยแล้ว");
    },
    onError: (err) => toast.error("เกิดข้อผิดพลาด: " + err.message),
  });

  const updateUserMutation = trpc.appUsers.update.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      setShowEditUser(null);
      toast.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
    },
    onError: (err) => toast.error("เกิดข้อผิดพลาด: " + err.message),
  });

  const deleteUserMutation = trpc.appUsers.delete.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      setShowDeleteConfirm(null);
      toast.success("ลบผู้ใช้เรียบร้อยแล้ว");
    },
    onError: (err) => toast.error("เกิดข้อผิดพลาด: " + err.message),
  });

  const handleCreate = () => {
    if (!form.name || !form.phone || !form.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const existing = appUsers.find((u: AppUser) => u.phone.replace(/[-\s]/g, "") === form.phone.replace(/[-\s]/g, ""));
    if (existing) { toast.error("เบอร์โทรนี้มีในระบบแล้ว"); return; }
    createUserMutation.mutate({
      phone: form.phone,
      password: form.password,
      role: "company",
      companyRole: form.companyRole,
      name: form.name,
      email: form.email || undefined,
    });
  };

  const handleEditSave = () => {
    if (!showEditUser) return;
    if (!editForm.name || !editForm.phone) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const update: {
      id: string;
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      companyRole?: CompanyRole;
    } = {
      id: showEditUser.id,
      name: editForm.name,
      phone: editForm.phone,
      companyRole: editForm.companyRole,
    };
    if (editForm.email) update.email = editForm.email;
    if (editForm.password) update.password = editForm.password;
    updateUserMutation.mutate(update);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          ผู้ใช้ในระบบ ({appUsers.length} คน)
        </h2>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8"
          onClick={() => setShowCreateUser(true)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b border-border flex-shrink-0">
        {COMPANY_ROLES.map((role) => {
          const count = appUsers.filter((u: AppUser) => u.companyRole === role).length;
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className={cn("rounded-lg p-2 text-center", COMPANY_ROLE_COLORS[role])}>
              <Icon className="w-4 h-4 mx-auto mb-1" />
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs">{COMPANY_ROLE_LABELS[role]}</p>
            </div>
          );
        })}
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {appUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Users className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">ยังไม่มีผู้ใช้ในระบบ</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {appUsers.map((user: AppUser) => {
              const role = (user.companyRole || "ae") as CompanyRole;
              const Icon = ROLE_ICONS[role];
              return (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0", user.avatarColor || "bg-blue-500")}>
                    {user.avatarInitials?.slice(0, 2) || user.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{user.name}</span>
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0", COMPANY_ROLE_COLORS[role])}>
                        <Icon className="w-2.5 h-2.5" />
                        {COMPANY_ROLE_LABELS[role]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{user.phone}</span>
                      {user.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />{user.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditForm({
                          name: user.name,
                          phone: user.phone,
                          email: user.email || "",
                          password: "",
                          companyRole: role,
                        });
                        setShowEditUser(user);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setShowDeleteConfirm(user)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อ <span className="text-red-500">*</span></Label>
              <Input
                placeholder="ชื่อ-นามสกุล"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="08x-xxx-xxxx"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง <span className="text-red-500">*</span></Label>
              <Select value={form.companyRole} onValueChange={(v) => setForm((f) => ({ ...f, companyRole: v as CompanyRole }))}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>ยกเลิก</Button>
            <Button
              onClick={handleCreate}
              disabled={createUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUserMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังเพิ่ม...</> : "เพิ่มผู้ใช้"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!showEditUser} onOpenChange={(o) => !o && setShowEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
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
              <Label>อีเมล</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(null)}>ยกเลิก</Button>
            <Button
              onClick={handleEditSave}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(o) => !o && setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            คุณต้องการลบผู้ใช้ <strong>{showDeleteConfirm?.name}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && deleteUserMutation.mutate({ id: showDeleteConfirm.id })}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "กำลังลบ..." : "ลบผู้ใช้"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
