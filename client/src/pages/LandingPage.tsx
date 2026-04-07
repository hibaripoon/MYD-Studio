import { useLocation } from "wouter";
import { Building2, Users, ArrowRight, Zap, BarChart3, CheckCircle2 } from "lucide-react";
import { customers } from "@/lib/database";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">MYD Studio</span>
        </div>
        <span className="text-slate-400 text-xs sm:text-sm hidden sm:block">Work Management &amp; CRM</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-sm font-medium">Media Company Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            จัดการงาน &amp; ลูกค้า<br />
            <span className="text-blue-400">ในที่เดียว</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            ระบบ Work Management และ CRM สำหรับบริษัท Media<br />
            ติดตามงาน เก็บเงิน และดูแลลูกค้าได้อย่างมีประสิทธิภาพ
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          {/* AE Portal */}
          <button
            onClick={() => navigate("/ae")}
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-500/30 transition-colors">
              <Building2 className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">AE Portal</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              จัดการ Task, ดูแลลูกค้า CRM และติดตาม Cash Collection
            </p>
            <div className="space-y-2 mb-6">
              {["Sponsor Management", "Customer CRM", "Cash Collection"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 text-sm">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all">
              เข้าสู่ระบบ AE <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Customer Portal */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Customer Portal</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              ดูสถานะงาน หลักฐานการทำงาน และเอกสารทางการเงิน
            </p>
            <p className="text-slate-500 text-xs mb-4">เลือกลูกค้าเพื่อเข้าสู่ระบบ:</p>
            <div className="space-y-2">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/customer/${c.id}`)}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl px-4 py-2.5 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {c.avatarInitials}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{c.name}</p>
                    <p className="text-slate-500 text-xs truncate">{c.company}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {[
            { icon: BarChart3, value: "5+", label: "ลูกค้า Active" },
            { icon: CheckCircle2, value: "6+", label: "Projects" },
            { icon: Zap, value: "3", label: "AE ในทีม" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-slate-500 mb-1" />
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-slate-500 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
