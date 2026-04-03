/**
 * Login Page — Phone-based authentication
 * Session cached for 7 days in localStorage
 * Routes: AE → /ae | Customer → /customer/:id
 * Design: Modern SaaS — Deep Navy + Warm White
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, getSession, saveSession, clearSession } from "@/lib/database";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const user = db.getUserById(session.userId);
      if (user) {
        if (user.role === "ae") {
          navigate("/ae");
        } else if (user.role === "customer" && user.customerId) {
          navigate(`/customer/${user.customerId}`);
        }
      } else {
        clearSession();
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError("กรุณากรอกเบอร์โทรและรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");

    // Simulate async (UX polish)
    await new Promise((r) => setTimeout(r, 600));

    const user = db.login(phone, password);
    setLoading(false);

    if (!user) {
      setError("เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    saveSession(user.id, user.role);

    if (user.role === "ae") {
      navigate("/ae");
    } else if (user.role === "customer" && user.customerId) {
      navigate(`/customer/${user.customerId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.16 0.035 255)" }}>
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">MediaFlow</p>
            <p className="text-slate-400 text-xs">Work Management & CRM</p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            จัดการงาน<br />
            <span className="text-blue-400">ครบในที่เดียว</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            ระบบ Work Management และ CRM สำหรับบริษัท Media
            ติดตามงาน เก็บเงิน และดูแลลูกค้าได้อย่างมีประสิทธิภาพ
          </p>

          {/* Features */}
          <div className="space-y-3 pt-4">
            {[
              "Task Management — ติดตามงานทุกชิ้น",
              "Customer CRM — ข้อมูลลูกค้าครบถ้วน",
              "Cash Collection — ติดตามการชำระเงิน",
              "Customer Portal — ลูกค้าดูงานได้เอง",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-slate-600 text-xs">© 2025 MediaFlow. All rights reserved.</p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-xl">MediaFlow</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">เข้าสู่ระบบ</h2>
              <p className="text-muted-foreground text-sm mt-1">ใช้เบอร์โทรศัพท์และรหัสผ่านของคุณ</p>
            </div>

            <div className="space-y-5">
              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">เบอร์โทรศัพท์</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-11"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium">ข้อมูล Demo สำหรับทดสอบ</p>
              <div className="grid grid-cols-2 gap-2">
                <DemoCard
                  label="AE (ปิยะ)"
                  phone="0812345001"
                  password="ae1234"
                  color="bg-blue-50 border-blue-200"
                  onClick={() => { setPhone("0812345001"); setPassword("ae1234"); }}
                />
                <DemoCard
                  label="ลูกค้า (สมชาย)"
                  phone="0812345678"
                  password="cust1234"
                  color="bg-emerald-50 border-emerald-200"
                  onClick={() => { setPhone("0812345678"); setPassword("cust1234"); }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCard({ label, phone, password, color, onClick }: {
  label: string;
  phone: string;
  password: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-lg border p-2.5 text-left hover:opacity-80 transition-opacity", color)}
    >
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground font-mono">{phone}</p>
      <p className="text-xs text-muted-foreground font-mono">{password}</p>
    </button>
  );
}
