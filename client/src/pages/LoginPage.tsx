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
import { getSession, saveSession, clearSession } from "@/lib/database";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.appLogin.useMutation({
    onSuccess: (user) => {
      // Store customerId alongside userId so session-restore redirect works correctly
      saveSession(user.id, user.role as any, user.companyRole as any, user.customerId ?? undefined);
      if (user.role === "company") {
        navigate("/ae");
      } else if (user.role === "customer" && user.customerId) {
        navigate(`/customer/${user.customerId}`);
      }
    },
    onError: (err) => {
      setError(err.message || "เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง");
    },
  });

  // Check existing session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      if (session.role === "company" || (session.role as string) === "ae") {
        navigate("/ae");
      } else if (session.role === "customer") {
        // Use stored customerId if available, fall back to userId for legacy sessions
        const customerId = (session as any).customerId || session.userId;
        navigate(`/customer/${customerId}`);
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError("กรุณากรอกเบอร์โทรและรหัสผ่าน");
      return;
    }
    setError("");
    loginMutation.mutate({ phone: phone.replace(/[-\s]/g, ""), password });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.16 0.035 255)" }}>
      {/* Left Panel — Hero Image */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663483301004/oTjyzAWH7XdK3JwyyGKUHT/login-hero-eLVASJ3K8xrJJXcpJCMD6r.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-xl">mydstudio</p>
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
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

