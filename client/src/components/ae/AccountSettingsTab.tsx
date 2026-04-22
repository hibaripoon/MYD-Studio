/**
 * Account Settings Tab — AE user profile settings
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useState } from "react";
import { User, Camera, CreditCard, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppUser } from "@/lib/database";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AccountSettingsTab({ user, onUpdate }: { user: AppUser; onUpdate: (updated?: AppUser) => void }) {
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || "");
  const [name, setName] = useState(user.name);
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();

  const updateUserMutation = trpc.appUsers.update.useMutation({
    onSuccess: () => {
      utils.appUsers.list.invalidate();
      const updated: AppUser = {
        ...user,
        name: name.trim(),
        profilePhoto: profilePhoto || undefined,
      };
      onUpdate(updated);
    },
  });

  const handleSaveProfile = () => {
    if (!name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    updateUserMutation.mutate(
      { id: user.id, name: name.trim(), profilePhoto: profilePhoto || undefined },
      {
        onSuccess: () => { setSaving(false); toast.success("บันทึกข้อมูลโปรไฟล์แล้ว"); },
        onError: () => { setSaving(false); toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"); },
      }
    );
  };

  const handleChangePin = () => {
    if (!currentPin || !newPin || !confirmPin) { toast.error("กรุณากรอกข้อมูลให้ครบ"); return; }
    if (newPin !== confirmPin) { toast.error("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (newPin.length < 4) { toast.error("รหัสผ่านต้องมีอย่างน้อย 4 ตัว"); return; }
    if (user.password !== currentPin) { toast.error("รหัสผ่านปัจจุบันไม่ถูกต้อง"); return; }
    updateUserMutation.mutate(
      { id: user.id, password: newPin },
      {
        onSuccess: () => {
          setCurrentPin(""); setNewPin(""); setConfirmPin("");
          toast.success("เปลี่ยนรหัสผ่านแล้ว");
        },
        onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">ข้อมูลโปรไฟล์</p>
            <p className="text-xs text-muted-foreground">ชื่อ, รูปโปรไฟล์</p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {profilePhoto ? (
                <img src={profilePhoto} alt={name} className="w-20 h-20 rounded-2xl object-cover border border-border" />
              ) : (
                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold", user.avatarColor)}>
                  {user.avatarInitials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">URL รูปโปรไฟล์ (ไม่บังคับ)</Label>
              <Input placeholder="https://..." value={profilePhoto} onChange={(e) => setProfilePhoto(e.target.value)} />
              <p className="text-xs text-muted-foreground">วาง URL รูปภาพจาก Google Drive, Imgur หรือ CDN</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving || updateUserMutation.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4" />
            {saving || updateUserMutation.isPending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
          </Button>
        </div>
      </div>

      {/* Bank Account Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">บัญชีธนาคาร</p>
            <p className="text-xs text-muted-foreground">สำหรับรับค่าคอมมิชชั่น</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>ชื่อธนาคาร</Label>
            <Input placeholder="เช่น กสิกรไทย, ไทยพาณิชย์" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>เลขบัญชี</Label>
            <Input placeholder="xxx-x-xxxxx-x" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || updateUserMutation.isPending} variant="outline" className="gap-2">
            <Save className="w-4 h-4" />
            บันทึกบัญชีธนาคาร
          </Button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">เปลี่ยนรหัสผ่าน</p>
            <p className="text-xs text-muted-foreground">ต้องใส่รหัสผ่านปัจจุบันเพื่อยืนยัน</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>รหัสผ่านปัจจุบัน</Label>
            <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>รหัสผ่านใหม่</Label>
            <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" />
          </div>
          <div className="space-y-1.5">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePin} disabled={updateUserMutation.isPending} variant="outline" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
            <Lock className="w-4 h-4" />
            เปลี่ยนรหัสผ่าน
          </Button>
        </div>
      </div>
    </div>
  );
}
