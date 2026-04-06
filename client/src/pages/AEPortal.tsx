/**
 * AE Portal — Main layout with sidebar navigation
 * Design: Modern SaaS — Deep Navy sidebar + Warm White content
 * Tabs: Customer CRM (top) | Task Management | Cash Collection
 * Auth: phone-based session, 7-day cache
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, CreditCard, Zap, LogOut,
  ChevronRight, Bell, Menu, X, Settings, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDatabase } from "@/contexts/DatabaseContext";
import TaskManagementTab from "@/components/ae/TaskManagementTab";
import CustomerCRMTab from "@/components/ae/CustomerCRMTab";
import CashCollectionTab from "@/components/ae/CashCollectionTab";
import { clearSession, getSession, AppUser } from "@/lib/database";
import { trpc } from "@/lib/trpc";
import UserManagementContent from "@/components/ae/UserManagementContent";
import DashboardTab from "@/components/ae/DashboardTab";
import AccountSettingsTab from "@/components/ae/AccountSettingsTab";
import SystemSettingsTab from "@/components/ae/SystemSettingsTab";

type TabId = "customers" | "tasks" | "cash" | "users" | "dashboard" | "account" | "settings";

// Customer CRM is now FIRST (top) per feedback item 2
const navItems = [
  { id: "customers" as TabId, label: "Customer CRM", icon: Users, path: "/ae/crm" },
  { id: "tasks" as TabId, label: "Task Management", icon: LayoutDashboard, path: "/ae" },
  { id: "cash" as TabId, label: "Cash Collection", icon: CreditCard, path: "/ae/cash" },
];

export default function AEPortal() {
  const [location, navigate] = useLocation();
  const { tasks, appUsers, isLoading } = useDatabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Auth guard — reads session then finds user from persistent appUsers
  useEffect(() => {
    const session = getSession();
    if (!session) { navigate("/login"); return; }
    // Accept company role OR legacy ae role (old cached sessions)
    if (session.role !== "company" && (session.role as string) !== "ae") {
      clearSession();
      navigate("/login");
      return;
    }
    // Try to find user from persistent store first, fall back to session data
    if (appUsers.length > 0) {
      const user = appUsers.find((u) => u.id === session.userId);
      if (user) {
        setCurrentUser(user);
      } else {
        // User not found in DB — may be a stale session
        clearSession();
        navigate("/login");
      }
    }
  }, [navigate, appUsers]);

  // Determine active tab from URL
  const activeTab: TabId = location.includes("/users")
    ? "users"
    : location.includes("/dashboard")
    ? "dashboard"
    : location.includes("/account")
    ? "account"
    : location.includes("/settings")
    ? "settings"
    : location.includes("/crm") || location.includes("/customers")
    ? "customers"
    : location.includes("/cash")
    ? "cash"
    : "tasks";

  const unpaidCount = tasks.filter(
    (t) => t.cashCollection.status === "unpaid" || t.cashCollection.status === "invoiced"
  ).length;

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  // Show spinner while context data is loading to avoid blank screen or premature logout
  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-30 flex flex-col h-full w-60 flex-shrink-0 transition-transform duration-300",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: "oklch(0.2 0.04 255)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">MediaFlow</p>
            <p className="text-slate-400 text-xs">AE Portal</p>
          </div>
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            เมนูหลัก
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                  isActive
                    ? "bg-blue-500/20 text-blue-300 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>

                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}

          {/* Divider */}
          <div className="pt-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
              ระบบ
            </p>
            {([
              { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard, path: "/ae/dashboard", adminOnly: false },
              { id: "users" as TabId, label: "User Management", icon: UserCog, path: "/ae/users", adminOnly: true },
              { id: "settings" as TabId, label: "System Settings", icon: Settings, path: "/ae/settings", adminOnly: true },
            ] as const).filter((item) => !item.adminOnly || currentUser.companyRole === "admin").map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                  activeTab === item.id
                    ? "bg-blue-500/20 text-blue-300 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            ))}
          </div>
        </nav>

          {/* User info */}
          <div className="px-3 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <button
                onClick={() => { navigate("/ae/account"); setSidebarOpen(false); }}
                className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
              {currentUser.profilePhoto ? (
                <img src={currentUser.profilePhoto} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                currentUser.avatarColor
              )}>
                {currentUser.avatarInitials}
              </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-slate-500 text-xs">{currentUser.companyRole === "admin" ? "Admin" : currentUser.companyRole === "sub_admin" ? "Sub Admin" : currentUser.companyRole === "head" ? "Head AE" : "Account Executive"}</p>
              </div>
              </button>
            <button
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-border flex-shrink-0">
          <button
            className="md:hidden text-slate-500 hover:text-slate-700 flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
              {activeTab === "customers" && "Customer CRM"}
              {activeTab === "tasks" && "Task Management"}
              {activeTab === "cash" && "Cash Collection"}
              {activeTab === "users" && "User Management"}
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "account" && "Account Settings"}
              {activeTab === "settings" && "System Settings"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate hidden sm:block">
              {activeTab === "customers" && "ข้อมูลลูกค้าและประวัติการจ้างงาน"}
              {activeTab === "tasks" && "จัดการและติดตามงานทั้งหมด"}
              {activeTab === "cash" && "ติดตามการเก็บเงินและสถานะการชำระ"}
              {activeTab === "users" && "จัดการผู้ใช้งานและสิทธิ์การเข้าถึง"}
              {activeTab === "dashboard" && "ภาพรวมรายได้และผลการดำเนินงาน"}
              {activeTab === "account" && "ตั้งค่าโปรไฟล์และข้อมูลส่วนตัว"}
              {activeTab === "settings" && "ตั้งค่าระบบ, Media และ Product catalog"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {activeTab === "customers" && <CustomerCRMTab />}
          {activeTab === "tasks" && (
            <TaskManagementTab
              initialArchiveOpen={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("archive") === "1"}
            />
          )}
          {activeTab === "cash" && (
            <CashCollectionTab
              initialArchiveOpen={typeof window !== "undefined" && new URLSearchParams(window.location.search).get("archive") === "1"}
            />
          )}
          {activeTab === "users" && (currentUser.companyRole === "admin" ? <UserManagementContent /> : <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</div>)}
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "account" && currentUser && <AccountSettingsTab user={currentUser} onUpdate={(updatedUser) => { if (updatedUser) setCurrentUser(updatedUser); }} />}
          {activeTab === "settings" && (currentUser.companyRole === "admin" ? <SystemSettingsTab /> : <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">คุณไม่มีสิทธิ์เข้าถึงส่วนนี้</div>)}
        </main>
      </div>
    </div>
  );
}
